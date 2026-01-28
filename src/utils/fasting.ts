export interface FastingZoneData {
  name: string;
  hours: number;
  benefits: string;
  color: string;
  breakingFast: {
    foods: string[];
    avoid: string[];
    notes: string;
  };
}

export const FASTING_ZONES: FastingZoneData[] = [
  {
    name: "Anabolic",
    hours: 4,
    benefits: "Blood sugar and insulin decrease",
    color: "#d97706",
    breakingFast: {
      foods: [
        "Any balanced meal",
        "Protein and vegetables",
        "Whole grains",
      ],
      avoid: ["Excessive sugar"],
      notes:
        "Your digestive system is fully active. You can eat normally.",
    },
  },
  {
    name: "Catabolic",
    hours: 12,
    benefits: "Ketosis begins, fat burning starts",
    color: "#65a30d",
    breakingFast: {
      foods: [
        "Bone broth",
        "Small protein portions",
        "Leafy greens",
        "Avocado",
      ],
      avoid: ["Large meals", "Heavy carbs", "Processed foods"],
      notes:
        "Start with something light. Your body is in fat-burning mode.",
    },
  },
  {
    name: "Fat Burning",
    hours: 16,
    benefits: "Peak fat burning and ketone production",
    color: "#059669",
    breakingFast: {
      foods: [
        "Bone broth",
        "Eggs",
        "Nuts",
        "Greek yogurt",
        "Lean protein",
      ],
      avoid: ["Large meals", "Refined carbs", "Sugary foods"],
      notes:
        "Break gently with protein and healthy fats. Wait 30-60 min before a full meal.",
    },
  },
  {
    name: "Autophagy",
    hours: 18,
    benefits: "Cellular repair and autophagy increase",
    color: "#0f766e",
    breakingFast: {
      foods: [
        "Bone broth first",
        "Then small portions of salmon",
        "Steamed vegetables",
        "Fermented foods",
      ],
      avoid: [
        "Large meals immediately",
        "Dairy initially",
        "High-fiber foods at first",
      ],
      notes:
        "Break slowly over 1-2 hours. Start with broth, wait 30 min, then small protein portions.",
    },
  },
  {
    name: "Deep Autophagy",
    hours: 24,
    benefits: "Maximum autophagy and growth hormone",
    color: "#57534e",
    breakingFast: {
      foods: [
        "Bone broth or vegetable broth",
        "Watermelon or berries",
        "Small amounts of cooked vegetables",
        "Later: light protein",
      ],
      avoid: [
        "Heavy proteins initially",
        "Large portions",
        "Processed foods",
        "Dairy",
      ],
      notes:
        "IMPORTANT: Break very gently. Start with broth and fruits. Wait several hours before regular meals.",
    },
  },
  {
    name: "Immune Reset",
    hours: 48,
    benefits: "Immune system regeneration begins",
    color: "#b45309",
    breakingFast: {
      foods: [
        "Diluted fruit juice",
        "Bone broth",
        "Watermelon",
        "Cooked vegetables (no raw)",
        "Gradual reintroduction over 24h",
      ],
      avoid: [
        "Solid foods immediately",
        "Raw vegetables",
        "Nuts",
        "Dairy",
        "Heavy proteins",
      ],
      notes:
        "CRITICAL: Take 24+ hours to refeed. Start with liquids only. Risk of refeeding syndrome - consult doctor.",
    },
  },
  {
    name: "Stem Cell",
    hours: 72,
    benefits: "Stem cell regeneration activated",
    color: "#166534",
    breakingFast: {
      foods: [
        "Medical supervision recommended",
        "Diluted juices",
        "Bone broth",
        "Very gradual reintroduction over 2-3 days",
      ],
      avoid: [
        "Any solid foods for first 24h",
        "All recommendations from 48h fast",
      ],
      notes:
        "MEDICAL SUPERVISION REQUIRED: Refeeding syndrome is a serious risk. Break over 48-72 hours minimum.",
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
