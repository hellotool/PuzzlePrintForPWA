type ClassValue = string | false | null | undefined;

export default function clsx(...values: ClassValue[]) {
  return values.filter(Boolean).join(' ');
}
