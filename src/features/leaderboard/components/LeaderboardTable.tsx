import { Table, TableHead, TableRow, TableCell, TableBody, Paper, Link } from '@mui/material';
import NextLink from 'next/link';

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
                <Link component={NextLink} href={`/users/${row.userId}`} color="primary" underline="hover">
                  {row.displayName}
                </Link>
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
