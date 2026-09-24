/** Port of `src/app/pages/shared/utils/slugifying.ts`. */
export function slugify(value: string): string {
  const from =
    "àáäâãåăæąçćčđèéėëêęǵḧìíïîįłḿǹńňñòóöôœøṕŕřßśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;";
  const to = "aaaaaaaaacccdeeeeeeghiiiiilmnnnnooooooprrssssttuuuuuuuuuwxyyzzz------";
  const pattern = new RegExp(from.split("").join("|"), "g");

  return value
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(pattern, (char) => to.charAt(from.indexOf(char)))
    .replace(/&/g, "-and-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
