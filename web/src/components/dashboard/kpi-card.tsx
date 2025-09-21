"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  label: string;
  value: string | number;
  description?: string;
  href?: string;
};

export function KpiCard({ label, value, description, href }: Props) {
  const inner = (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{label}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="transition-colors hover:opacity-90">
        {inner}
      </a>
    );
  }

  return inner;
}