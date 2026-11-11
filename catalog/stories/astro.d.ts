// tsc reads no .astro file, so this types its import; nothing type-checks the frame's own props.
declare module "*.astro" {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
