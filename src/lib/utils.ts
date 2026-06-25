import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Logic to calculate composite score based on the suggested formula:
// 40% Accuracy, 30% Reaction Time, 20% Performance, 10% Error Control
export function calculateCompositeScore(
  reactionTimeMs: number,
  accuracyPercentage: number,
  completionTimeSeconds?: number,
  misses?: number,
  falseStarts?: number
): number {
  // Normalize Reaction Time (assuming a solid RT is around 300ms, and max bad is maybe 1200ms)
  // Lower is better, so we map 300ms -> 100 points, 1200ms -> 0 points
  let rtScore = 100 - ((reactionTimeMs - 250) / 950) * 100;
  rtScore = Math.max(0, Math.min(100, rtScore)); 

  // Accuracy is straightforward 0-100
  let accScore = accuracyPercentage;

  // Performance/Completion time (assuming a typical drill is 30s-60s)
  // Let's assume standard time is 60s, lower time with same accuracy is better
  let compScore = 100;
  if (completionTimeSeconds) {
    compScore = 100 - ((completionTimeSeconds - 20) / 80) * 100;
    compScore = Math.max(0, Math.min(100, compScore));
  }

  // Error control (misses and false starts)
  const totalErrors = (misses || 0) + (falseStarts || 0);
  let errorScore = 100 - (totalErrors * 5); // 5 points off per error
  errorScore = Math.max(0, errorScore);

  // Composite calculation
  const composite = 
    (accScore * 0.40) + 
    (rtScore * 0.30) + 
    (compScore * 0.20) + 
    (errorScore * 0.10);

  return Math.round(composite * 10) / 10; // 1 decimal place
}

export function exportToCSV(filename: string, rows: any[]) {
  if (!rows || !rows.length) return;

  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
