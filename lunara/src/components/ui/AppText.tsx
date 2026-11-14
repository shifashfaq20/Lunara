import { Text, type TextProps } from 'react-native';
import { numericStyle } from '@/constants/theme';

export type TextVariant = 'hero' | 'display' | 'title' | 'heading' | 'lead' | 'body' | 'caption' | 'micro';

const VARIANTS: Record<TextVariant, string> = {
  hero: 'text-hero font-extrabold text-ink',
  display: 'text-display font-bold text-ink',
  title: 'text-title font-bold text-ink',
  heading: 'text-heading font-semibold text-ink',
  lead: 'text-lead text-ink-soft',
  body: 'text-body text-ink-soft',
  caption: 'text-caption text-ink-muted',
  micro: 'text-micro text-ink-muted',
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  /** Overrides the variant colour. */
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Tabular figures for values that change. */
  numeric?: boolean;
  className?: string;
}

const WEIGHTS = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;

export function AppText({ variant = 'body', color, weight, numeric, className, style, ...rest }: AppTextProps) {
  return (
    <Text
      className={`${VARIANTS[variant]} ${className ?? ''}`}
      style={[numeric ? numericStyle : null, color ? { color } : null, weight ? { fontWeight: WEIGHTS[weight] } : null, style]}
      {...rest}
    />
  );
}
