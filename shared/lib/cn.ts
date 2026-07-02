type ClassValue = string | number | null | boolean | undefined | ClassValue[];

/** Combina clases condicionalmente sin depender de librerías externas. */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) classes.push(nested);
    } else {
      classes.push(String(value));
    }
  }
  return classes.join(" ");
}
