export type GlossaryStatus = 'implemented' | 'planned' | 'not-started';

export interface ConceptEntry {
  term: string;
  plainEnglish: string;
  technical: string;
  whyItMatters: string;
  implementation: string;
  status: GlossaryStatus;
}

export type PricingKind = 'free' | 'freemium' | 'paid';

export interface ToolEntry {
  name: string;
  whatItIs: string;
  whatItDoes: string;
  whyUseIt: string;
  howWeUseIt: string;
  pricing: PricingKind;
  status: GlossaryStatus;
  phaseLabel: string;
  docsUrl: string;
}

export interface PracticeEntry {
  name: string;
  whatItMeans: string;
  whyItMatters: string;
  howWeFollowIt: string;
  codeExample: string;
  status: GlossaryStatus;
}

export interface PracticeAppEntry {
  name: string;
  description: string;
  skills: string[];
  status: GlossaryStatus;
  statusNote: string;
  link?: string;
}

export type ParamUsage = 'used' | 'available';

export interface ApiParameterEntry {
  name: string;
  type: string;
  usage: ParamUsage;
  plainEnglish: string;
  technical: string;
  defaultValue?: string;
  example: string;
}

export interface ResponseFieldEntry {
  name: string;
  type: string;
  plainEnglish: string;
  technical: string;
  example: string;
}
