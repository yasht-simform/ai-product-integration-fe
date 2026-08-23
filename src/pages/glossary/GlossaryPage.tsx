import { useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Layers, ListChecks, Rocket, Search } from 'lucide-react';
import { Link } from 'react-router';

import { ApiParametersSection } from '@/pages/glossary/ApiParametersSection';
import { GlossaryStatusBadge, PricingBadge } from '@/pages/glossary/badges';
import { CONCEPTS, PRACTICES, PRACTICE_APPS, TOOLS } from '@/pages/glossary/data';
import { Field, NoMatches, SectionHeading, useSearchMatch } from '@/pages/glossary/shared';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export function GlossaryPage() {
  const [search, setSearch] = useState('');
  const matches = useSearchMatch(search);

  const concepts = useMemo(
    () => CONCEPTS.filter((c) => matches(c.term, c.plainEnglish, c.technical, c.implementation)),
    [matches],
  );
  const tools = useMemo(
    () => TOOLS.filter((t) => matches(t.name, t.whatItIs, t.whatItDoes, t.howWeUseIt)),
    [matches],
  );
  const practices = useMemo(
    () => PRACTICES.filter((p) => matches(p.name, p.whatItMeans, p.howWeFollowIt)),
    [matches],
  );
  const apps = useMemo(
    () => PRACTICE_APPS.filter((a) => matches(a.name, a.description, ...a.skills)),
    [matches],
  );

  const implementedCount = CONCEPTS.filter((c) => c.status === 'implemented').length;
  const progressPercent = Math.round((implementedCount / CONCEPTS.length) * 100);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Glossary & Learning Reference"
        description="A plain-English and technical reference for every concept, tool, and practice from the G3 AI Product Integration learning goal — written for the whole team, not just whoever built it."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">
                {implementedCount} of {CONCEPTS.length} concepts implemented
              </span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms, tools, practices…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Accordion
        type="multiple"
        defaultValue={['concepts', 'tools', 'practices', 'apps', 'api-params']}
        className="flex flex-col gap-4"
      >
        <Card className="py-0">
          <AccordionItem value="concepts" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <SectionHeading
                icon={BookOpen}
                title="Concepts & Learning Areas"
                subtitle={`${concepts.length} of ${CONCEPTS.length} shown`}
              />
            </AccordionTrigger>
            <AccordionContent className="px-6">
              {concepts.length === 0 ? (
                <NoMatches />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {concepts.map((concept) => (
                    <Card key={concept.term} className="border-border/80">
                      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                        <CardTitle className="text-base">{concept.term}</CardTitle>
                        <GlossaryStatusBadge status={concept.status} />
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 text-sm">
                        <Field label="Plain English">{concept.plainEnglish}</Field>
                        <Field label="Technical Definition" muted>
                          {concept.technical}
                        </Field>
                        <Field label="Why It Matters" muted>
                          {concept.whyItMatters}
                        </Field>
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            How We Implemented It
                          </p>
                          <p className="mt-1 font-mono text-xs text-foreground/90">{concept.implementation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>

        <Card className="py-0">
          <AccordionItem value="tools" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <SectionHeading
                icon={Layers}
                title="Tools & Libraries"
                subtitle={`${tools.length} of ${TOOLS.length} shown`}
              />
            </AccordionTrigger>
            <AccordionContent className="px-6">
              {tools.length === 0 ? (
                <NoMatches />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <Card key={tool.name} className="border-border/80">
                      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                        <div>
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <p className="mt-1 text-xs text-muted-foreground">{tool.phaseLabel}</p>
                        </div>
                        <PricingBadge pricing={tool.pricing} />
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 text-sm">
                        <p className="font-medium">{tool.whatItIs}</p>
                        <Field label="What It Does" muted>
                          {tool.whatItDoes}
                        </Field>
                        <Field label="Why / When To Use It" muted>
                          {tool.whyUseIt}
                        </Field>
                        <div className="flex items-start justify-between gap-2 rounded-md bg-muted/50 p-3">
                          <div>
                            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                              How We Use It
                            </p>
                            <p className="mt-1 text-xs text-foreground/90">{tool.howWeUseIt}</p>
                          </div>
                          <GlossaryStatusBadge status={tool.status} />
                        </div>
                        <a
                          href={tool.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Official docs <ExternalLink className="size-3" />
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>

        <Card className="py-0">
          <AccordionItem value="practices" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <SectionHeading
                icon={ListChecks}
                title="Key Practices"
                subtitle={`${practices.length} of ${PRACTICES.length} shown`}
              />
            </AccordionTrigger>
            <AccordionContent className="px-6">
              {practices.length === 0 ? (
                <NoMatches />
              ) : (
                <div className="flex flex-col gap-4">
                  {practices.map((practice) => (
                    <Card key={practice.name} className="border-border/80">
                      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                        <CardTitle className="text-base">{practice.name}</CardTitle>
                        <GlossaryStatusBadge status={practice.status} />
                      </CardHeader>
                      <CardContent className="grid gap-4 lg:grid-cols-2">
                        <div className="flex flex-col gap-3 text-sm">
                          <Field label="What It Means">{practice.whatItMeans}</Field>
                          <Field label="Why It Matters" muted>
                            {practice.whyItMatters}
                          </Field>
                          <Field label="How We Follow It" muted>
                            {practice.howWeFollowIt}
                          </Field>
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap text-foreground/90">
                          {practice.codeExample}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>

        <Card className="py-0">
          <AccordionItem value="apps" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <SectionHeading
                icon={Rocket}
                title="Practice Apps from Goal Document"
                subtitle={`${apps.length} of ${PRACTICE_APPS.length} shown`}
              />
            </AccordionTrigger>
            <AccordionContent className="px-6">
              {apps.length === 0 ? (
                <NoMatches />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {apps.map((app) => (
                    <Card key={app.name} className="border-border/80">
                      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                        <CardTitle className="text-base">{app.name}</CardTitle>
                        <GlossaryStatusBadge status={app.status} />
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 text-sm">
                        <p className="text-muted-foreground">{app.description}</p>
                        <Field label="What It Teaches">
                          <span className="flex flex-wrap gap-1.5">
                            {app.skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-md bg-accent px-1.5 py-0.5 text-xs text-accent-foreground"
                              >
                                {skill}
                              </span>
                            ))}
                          </span>
                        </Field>
                        <Field label="Implementation Status" muted>
                          {app.statusNote}
                        </Field>
                        {app.link && (
                          <Link to={app.link} className="text-xs text-primary hover:underline">
                            Try it in the app →
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>

        <ApiParametersSection search={search} />
      </Accordion>
    </div>
  );
}
