declare module "canvas-confetti" {
  type ConfettiOptions = {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    scalar?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
  };

  type Confetti = (options?: ConfettiOptions) => Promise<null>;

  const confetti: Confetti;
  export default confetti;
}
