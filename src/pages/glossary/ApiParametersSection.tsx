import { useMemo } from 'react';
import { Settings2 } from 'lucide-react';

import { ParamUsageBadge } from '@/pages/glossary/badges';
import { API_PARAMETERS, RESPONSE_FIELDS } from '@/pages/glossary/data';
import { Field, NoMatches, SectionHeading, useSearchMatch } from '@/pages/glossary/shared';
import type { ApiParameterEntry, ResponseFieldEntry } from '@/pages/glossary/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ApiParametersSection({ search }: { search: string }) {
  const matches = useSearchMatch(search);

  const usedParams = useMemo(
    () => API_PARAMETERS.filter((p) => p.usage === 'used' && matches(p.name, p.plainEnglish, p.technical)),
    [matches],
  );
  const availableParams = useMemo(
    () => API_PARAMETERS.filter((p) => p.usage === 'available' && matches(p.name, p.plainEnglish, p.technical)),
    [matches],
  );
  const responseFields = useMemo(
    () => RESPONSE_FIELDS.filter((f) => matches(f.name, f.plainEnglish, f.technical)),
    [matches],
  );
  const shownCount = usedParams.length + availableParams.length + responseFields.length;
  const totalCount = API_PARAMETERS.length + RESPONSE_FIELDS.length;

  return (
    <Card className="py-0">
      <AccordionItem value="api-params" className="border-b-0">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <SectionHeading
            icon={Settings2}
            title="API Parameters Reference"
            subtitle={`${shownCount} of ${totalCount} shown`}
          />
        </AccordionTrigger>
        <AccordionContent className="px-6">
          {shownCount === 0 ? (
            <NoMatches />
          ) : (
            <div className="flex flex-col gap-6">
              <ParamGroup
                title="Parameters We Use"
                description="Every field we actually send to the OpenAI-compatible chat completions endpoint."
                params={usedParams}
              />
              <ParamGroup
                title="Parameters Available (Not Used)"
                description="Everything else the Chat Completions API accepts that this app doesn't currently send."
                params={availableParams}
              />
              <ResponseFieldGroup fields={responseFields} />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
}

function ParamGroup({
  title,
  description,
  params,
}: {
  title: string;
  description: string;
  params: ApiParameterEntry[];
}) {
  if (params.length === 0) return null;

  return (
    <div>
      <div className="mb-2">
        <h4 className="text-sm font-semibold">
          {title} <span className="font-normal text-muted-foreground">({params.length})</span>
        </h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Card className="gap-0 py-0">
        <Accordion type="multiple">
          {params.map((param) => (
            <AccordionItem key={param.name} value={param.name}>
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-2 pr-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{param.name}</code>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {param.type}
                  </Badge>
                  <span className="flex-1" />
                  <ParamUsageBadge usage={param.usage} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="flex flex-col gap-3 text-sm">
                  <Field label="Plain English">{param.plainEnglish}</Field>
                  <Field label="Technical Detail" muted>
                    {param.technical}
                  </Field>
                  {param.defaultValue && (
                    <Field label="Our Default" muted>
                      <code className="font-mono text-xs">{param.defaultValue}</code>
                    </Field>
                  )}
                  <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap text-foreground/90">
                    {param.example}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}

function ResponseFieldGroup({ fields }: { fields: ResponseFieldEntry[] }) {
  if (fields.length === 0) return null;

  return (
    <div>
      <div className="mb-2">
        <h4 className="text-sm font-semibold">
          Response Fields <span className="font-normal text-muted-foreground">({fields.length})</span>
        </h4>
        <p className="text-xs text-muted-foreground">What comes back on every chat completion response.</p>
      </div>
      <Card className="gap-0 py-0">
        <Accordion type="multiple">
          {fields.map((field) => (
            <AccordionItem key={field.name} value={field.name}>
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-2 pr-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{field.name}</code>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {field.type}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="flex flex-col gap-3 text-sm">
                  <Field label="Plain English">{field.plainEnglish}</Field>
                  <Field label="Technical Detail" muted>
                    {field.technical}
                  </Field>
                  <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap text-foreground/90">
                    {field.example}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}
