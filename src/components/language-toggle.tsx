"use client";

import * as React from "react";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage}>
      {language === "en" ? "Ban" : "Eng"}
    </Button>
  );
}
