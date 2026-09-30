import type { Product } from "@/types/catalog";

const synonymGroups = [
  ["كنبة", "أريكة", "صوفا", "sofa", "couch"],
  ["كرسي", "مقعد", "جلسة", "chair", "seat"],
  ["طفل", "أطفال", "رضيع", "مواليد", "baby", "infant", "kids"],
  ["راحة", "مريح", "استرخاء", "جلوس", "comfort", "relax"],
  ["ناموس", "ناموسية", "بعوض", "حشرات", "mosquito", "insect"],
  ["محمول", "طي", "سفر", "تنقل", "portable", "travel"],
].map((group) => group.map(normalizeSearchText));

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("ar")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(value: string) {
  if (value.startsWith("لل") && value.length > 5) return value.slice(2);
  if (value.startsWith("ال") && value.length > 4) return value.slice(2);
  return value;
}

function editDistanceAtMostOne(first: string, second: string) {
  if (Math.abs(first.length - second.length) > 1) return false;

  let firstIndex = 0;
  let secondIndex = 0;
  let edits = 0;
  while (firstIndex < first.length && secondIndex < second.length) {
    if (first[firstIndex] === second[secondIndex]) {
      firstIndex += 1;
      secondIndex += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;
    if (first.length > second.length) firstIndex += 1;
    else if (second.length > first.length) secondIndex += 1;
    else {
      firstIndex += 1;
      secondIndex += 1;
    }
  }

  return edits + Number(firstIndex < first.length || secondIndex < second.length) <= 1;
}

function getPriceConstraint(query: string) {
  const between = query.match(/(?:بين|ما بين|between)\s*(\d+)\s*(?:و|and|-)\s*(\d+)/);
  if (between) {
    return {
      min: Math.min(Number(between[1]), Number(between[2])),
      max: Math.max(Number(between[1]), Number(between[2])),
      matchedText: between[0],
    };
  }

  const max = query.match(/(?:اقل من|تحت|دون|حتى|under|below|less than|max)\s*(\d+)/);
  if (max) return { max: Number(max[1]), matchedText: max[0] };

  const min = query.match(/(?:اكثر من|فوق|اعلى من|above|over|more than|min)\s*(\d+)/);
  if (min) return { min: Number(min[1]), matchedText: min[0] };

  return null;
}

function getQueryTerms(query: string) {
  const normalized = normalizeSearchText(query);
  const price = getPriceConstraint(normalized);
  const text = normalized
    .replace(price?.matchedText ?? "", " ")
    .replace(/(?:درهم|dh|mad)/g, " ")
    .trim();
  return { terms: text.split(/\s+/).filter(Boolean).map(normalizeToken), price };
}

function getSynonyms(term: string) {
  if (term.length < 2) return [term];
  const group = synonymGroups.find((aliases) =>
    aliases.some((alias) => alias === term || alias.startsWith(term) || term.startsWith(alias)),
  );
  return group ? Array.from(new Set([term, ...group.flatMap((alias) => alias.split(" ").map(normalizeToken))])) : [term];
}

function matchTerm(term: string, candidates: string[]) {
  let best = 0;
  for (const candidate of candidates) {
    if (candidate === term) best = Math.max(best, 1);
    else if (candidate.startsWith(term)) best = Math.max(best, 0.78);
    else if (term.length > 1 && candidate.includes(term)) best = Math.max(best, 0.55);
    else if (term.length >= 4 && editDistanceAtMostOne(term, candidate)) best = Math.max(best, 0.32);
  }
  return best;
}

export function getProductSearchScore(product: Product, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return (product.isFeatured ? 100 : 0) + product.rating * 10 + product.discount;

  const { terms, price } = getQueryTerms(normalizedQuery);
  if (price && ((price.min !== undefined && product.price < price.min) || (price.max !== undefined && product.price > price.max))) {
    return -1;
  }

  const name = normalizeSearchText(product.name);
  const nameTokens = name.split(/\s+/).map(normalizeToken);
  const categoryTokens = normalizeSearchText(product.category).split(/\s+/).map(normalizeToken);
  const detailTokens = normalizeSearchText([
    product.description,
    product.badge,
    ...product.features,
    ...product.colors.map((color) => color.name),
  ].join(" ")).split(/\s+/).map(normalizeToken);
  if (terms.length === 0) return 10_000 + product.rating * 10 + product.discount;

  let matchedTerms = 0;
  let score = 0;
  for (const term of terms) {
    const synonyms = getSynonyms(term);
    const nameMatch = Math.max(...synonyms.map((synonym) => matchTerm(synonym, nameTokens)));
    const categoryMatch = Math.max(...synonyms.map((synonym) => matchTerm(synonym, categoryTokens)));
    const detailMatch = Math.max(...synonyms.map((synonym) => matchTerm(synonym, detailTokens)));
    const bestMatch = Math.max(nameMatch, categoryMatch, detailMatch);
    if (bestMatch > 0) matchedTerms += 1;
    score += nameMatch * 180 + categoryMatch * 140 + detailMatch * 70;
  }

  if (matchedTerms === 0) return -1;
  const phraseMatch = terms.length > 0 && name.includes(terms.join(" ")) ? 700 : 0;
  const coverage = matchedTerms / terms.length;
  return matchedTerms * 1_000 + coverage * 500 + phraseMatch + score + product.rating * 2 + product.discount;
}

export function rankProducts(products: Product[], query: string) {
  return products
    .map((product) => ({ product, score: getProductSearchScore(product, query) }))
    .filter(({ score }) => score >= 0)
    .sort((first, second) => second.score - first.score)
    .map(({ product }) => product);
}