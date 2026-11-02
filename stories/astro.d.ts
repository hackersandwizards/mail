// tsc reads no .astro file; Astro's compiler checks the frame itself.
declare module "*.astro" {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
