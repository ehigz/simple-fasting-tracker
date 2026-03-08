export interface FastingSession {
  id: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationHours: number;
  zonesReached: string[];
}

export function getZonesReached(startTime: Date, endTime: Date): string[] {
  const elapsed = endTime.getTime() - startTime.getTime();
  return FASTING_ZONES.filter(
    (z) => elapsed >= z.hours * 60 * 60 * 1000,
  ).map((z) => z.name);
}

export interface FastingZoneData {
  name: string;
  hours: number;
  benefits: string;
  color: string;
  learnMoreUrl: string;
  breakingFast: {
    notes: string;
  };
}

export const FASTING_ZONES: FastingZoneData[] = [
  {
    name: "Anabolic",
    hours: 4,
    benefits: "Blood sugar and insulin decrease",
    color: "#d97706",
    learnMoreUrl: "https://www.health.harvard.edu/heart-health/time-to-try-intermittent-fasting",
    breakingFast: {
      notes:
        "At this stage your digestive system remains fully active. The fasting community generally treats this as a normal eating window with no special refeeding considerations.",
    },
  },
  {
    name: "Catabolic",
    hours: 12,
    benefits: "Ketosis begins, fat burning starts",
    color: "#65a30d",
    learnMoreUrl: "https://my.clevelandclinic.org/health/articles/24003-ketosis",
    breakingFast: {
      notes:
        "At 12 hours, the fasting community commonly begins lighter refeeding approaches. As always, consult your doctor about what works for your individual health situation.",
    },
  },
  {
    name: "Fat Burning",
    hours: 16,
    benefits: "Peak fat burning and ketone production",
    color: "#059669",
    learnMoreUrl: "https://www.health.harvard.edu/staying-healthy/can-intermittent-fasting-help-with-weight-loss",
    breakingFast: {
      notes:
        "16 hours is a widely discussed milestone in the intermittent fasting community, often associated with a gradual reintroduction of protein and healthy fats. Research into 16:8 fasting continues — consult your doctor for guidance specific to you.",
    },
  },
  {
    name: "Autophagy",
    hours: 18,
    benefits: "Cellular repair and autophagy increase",
    color: "#0f766e",
    learnMoreUrl: "https://my.clevelandclinic.org/health/articles/24058-autophagy",
    breakingFast: {
      notes:
        "At this milestone, the fasting community commonly discusses slower refeeding over time. The science of autophagy at this duration is actively researched — consult your doctor about what's appropriate for your individual circumstances.",
    },
  },
  {
    name: "Deep Autophagy",
    hours: 24,
    benefits: "Maximum autophagy and growth hormone",
    color: "#57534e",
    learnMoreUrl: "https://my.clevelandclinic.org/health/articles/24058-autophagy",
    breakingFast: {
      notes:
        "Extended fasts of 24 hours carry meaningful considerations for how eating resumes. Research into autophagy at this stage is ongoing. Consult a qualified doctor before and after fasts of this length.",
    },
  },
  {
    name: "Immune Reset",
    hours: 48,
    benefits: "Immune system regeneration begins",
    color: "#b45309",
    learnMoreUrl: "https://www.medicalnewstoday.com/articles/277860",
    breakingFast: {
      notes:
        "Fasts of 48 hours carry serious physiological considerations, including risks associated with refeeding. Research by Valter Longo and others has explored immune regeneration at this duration. Consult a qualified doctor before undertaking a fast of this length.",
    },
  },
  {
    name: "Stem Cell",
    hours: 72,
    benefits: "Stem cell regeneration activated",
    color: "#166534",
    learnMoreUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4102383/",
    breakingFast: {
      notes:
        "72-hour fasts carry significant health risks including refeeding syndrome. Peer-reviewed research has explored stem cell regeneration at this duration. This length of fast should only be undertaken under the supervision of a qualified medical professional.",
    },
  },
];

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTargetTime(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dayLabel = "";
  if (date.toDateString() === today.toDateString()) {
    dayLabel = "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dayLabel = "Tomorrow";
  } else {
    dayLabel = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dayLabel} at ${time}`;
}
