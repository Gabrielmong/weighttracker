import { Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import Link from 'next/link';

export interface LeaderboardRowData {
  userId: string;
  displayName: string;
  rank: number;
  rawScore: number;
  finalScore: number;
  metricPctChange?: number;
}

export function LeaderboardTable({
  rows,
  scoreType,
  isPerMetric,
}: {
  rows: LeaderboardRowData[];
  scoreType: 'RAW' | 'FINAL';
  isPerMetric: boolean;
}) {
  return (
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">{isPerMetric ? '% Improvement' : 'Score'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.userId}>
              <TableCell>{row.rank}</TableCell>
              <TableCell>
                <Link href={`/users/${row.userId}`}>{row.displayName}</Link>
              </TableCell>
              <TableCell align="right">
                {isPerMetric
                  ? `${(row.metricPctChange ?? 0).toFixed(2)}%`
                  : (scoreType === 'RAW' ? row.rawScore : row.finalScore).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
