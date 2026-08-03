import type { CategoryInsight, Insights } from "@/Models/Insights";

/**
 * Turns the insights endpoint's numbers into the sentences the dashboard
 * shows. The API returns structure; the wording lives here, pure and
 * unit-testable — the panel just prints what this returns.
 */

export type InsightTone = "up" | "down" | "flat" | "info";

export type InsightSentence = {
  key: string;
  /** "up" = spending more than usual, "down" = less; drives the icon only. */
  tone: InsightTone;
  text: string;
};

/** Below this, a move against the average is noise, not news. */
const VS_AVERAGE_THRESHOLD = 15;
/** Below this, a month-over-month move is not worth a sentence. */
const VS_LAST_MONTH_THRESHOLD = 10;
/** How many category sentences the panel reads off the top. */
const MAX_CATEGORY_SENTENCES = 3;

function categorySentence(
  category: CategoryInsight,
  formatAmount: (amount: number) => string,
): InsightSentence | null {
  const name = category.categoryName;

  // "Eating out is 40% above your usual" — the strongest signal, because it
  // compares against three months, not just one.
  if (
    category.vsAveragePct !== null &&
    Math.abs(category.vsAveragePct) >= VS_AVERAGE_THRESHOLD
  ) {
    const pct = Math.round(Math.abs(category.vsAveragePct));
    const direction = category.vsAveragePct > 0 ? "above" : "below";
    return {
      key: `avg:${category.categoryId}`,
      tone: category.vsAveragePct > 0 ? "up" : "down",
      text: `${name} is ${pct}% ${direction} your usual.`,
    };
  }

  // "Groceries down 12% vs last month".
  if (
    category.momChangePct !== null &&
    Math.abs(category.momChangePct) >= VS_LAST_MONTH_THRESHOLD
  ) {
    const pct = Math.round(Math.abs(category.momChangePct));
    const direction = category.momChangePct > 0 ? "up" : "down";
    return {
      key: `mom:${category.categoryId}`,
      tone: category.momChangePct > 0 ? "up" : "down",
      text: `${name} ${direction} ${pct}% vs last month.`,
    };
  }

  // A category with spend but no baseline at all is itself the news.
  if (category.previousMonthTotal === 0 && category.currentMonthTotal > 0) {
    return {
      key: `new:${category.categoryId}`,
      tone: "info",
      text: `New this month: ${formatAmount(category.currentMonthTotal)} on ${name}.`,
    };
  }

  return null;
}

export function buildInsightSentences(
  insights: Insights,
  formatAmount: (amount: number) => string,
): InsightSentence[] {
  // Cold start: no month before this one has any spending, so every average
  // would be a division by zero dressed up as advice.
  if (insights.monthsWithHistory === 0) {
    return [
      {
        key: "cold-start",
        tone: "info",
        text: "Not enough history yet — insights appear once last month has expenses to compare against.",
      },
    ];
  }

  const sentences: InsightSentence[] = [];

  if (insights.overallVsAveragePct !== null) {
    const pct = Math.round(Math.abs(insights.overallVsAveragePct));
    if (pct < 5) {
      sentences.push({
        key: "overall",
        tone: "flat",
        text: "Overall spending is in line with your usual month.",
      });
    } else {
      const direction = insights.overallVsAveragePct > 0 ? "above" : "below";
      sentences.push({
        key: "overall",
        tone: insights.overallVsAveragePct > 0 ? "up" : "down",
        text: `Overall spending is ${pct}% ${direction} your usual month.`,
      });
    }
  }

  // The backend sorts biggest movers first, so reading off the top is already
  // "top movers".
  let taken = 0;
  for (const category of insights.categories) {
    if (taken >= MAX_CATEGORY_SENTENCES) break;
    const sentence = categorySentence(category, formatAmount);
    if (sentence) {
      sentences.push(sentence);
      taken += 1;
    }
  }

  if (sentences.length === 0) {
    sentences.push({
      key: "quiet",
      tone: "flat",
      text: "Nothing unusual this month — spending is tracking your history.",
    });
  }

  // Money that left the account but was never yours to spend. It is a fact
  // about the month rather than a verdict on it, so it is appended after the
  // spending read rather than competing with it — and it stays quiet for the
  // many people who never split a bill.
  if (insights.frontedThisMonth > 0 || insights.stillOpen > 0) {
    sentences.push({
      key: "fronted",
      tone: "info",
      text: `You fronted ${formatAmount(
        insights.frontedThisMonth,
      )} for others this month; ${formatAmount(insights.stillOpen)} is still out.`,
    });
  }

  // A thin baseline changes how much the averages should be trusted, so it is
  // said out loud rather than silently producing jumpy percentages.
  if (insights.monthsWithHistory < 3) {
    sentences.push({
      key: "thin-history",
      tone: "info",
      text: `Based on ${insights.monthsWithHistory} month${
        insights.monthsWithHistory === 1 ? "" : "s"
      } of history — comparisons sharpen as more builds up.`,
    });
  }

  return sentences;
}
