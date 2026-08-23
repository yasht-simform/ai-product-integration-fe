import { Calculator, Clock, Globe, type LucideIcon, Wrench } from 'lucide-react';

// The 3 built-in tools (ai-chat/constants/builtin-tools.constant.ts) get a distinct icon;
// anything else (HTTP tools registered by a user) falls back by handler type.
const BUILTIN_TOOL_ICONS: Record<string, LucideIcon> = {
  calculator: Calculator,
  datetime: Clock,
  weather: Globe,
};

export function getToolIcon(toolName: string, handlerType?: string): LucideIcon {
  return BUILTIN_TOOL_ICONS[toolName] ?? (handlerType === 'http' ? Globe : Wrench);
}
