import { View, type ViewProps } from 'react-native';

type Tone = 'glass' | 'deep' | 'raised' | 'outline';

const TONES: Record<Tone, string> = {
  glass: 'bg-glass border border-line',
  deep: 'bg-glass-deep border border-line',
  raised: 'bg-hull border border-line-strong',
  outline: 'border border-line',
};

export interface PanelProps extends ViewProps {
  tone?: Tone;
  /** Cards sit inside panels and use a tighter radius. */
  size?: 'panel' | 'card';
  className?: string;
}

export function Panel({ tone = 'glass', size = 'panel', className, ...rest }: PanelProps) {
  const shape = size === 'panel' ? 'rounded-panel p-5' : 'rounded-card p-4';
  return <View className={`${TONES[tone]} ${shape} ${className ?? ''}`} {...rest} />;
}
