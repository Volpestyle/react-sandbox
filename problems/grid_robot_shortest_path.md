# Grid Robot Shortest Path

## Problem Statement
You control a robot on an `m x n` grid. Each cell is either empty or a wall. Starting from `start = (sr, sc)` you must reach `target = (tr, tc)` in the fewest moves. From any empty cell you may move up, down, left, or right into another empty cell if it stays inside the grid. Return the minimum number of moves needed; return `-1` if the target is unreachable.

## Input Format
- `m`, `n` — grid dimensions (`1 ≤ m, n ≤ 500`)
- `grid` — list of `m` strings of length `n`, using `'.'` for empty cells and `'#'` for walls (start and target cells are guaranteed `'.'`)
- `sr`, `sc`, `tr`, `tc` — zero-based coordinates

## Output Format
Return a single integer representing the minimum number of moves from start to target, or `-1` if no path exists.

## Example
```
Input:
5 7
.......
.###..#
....#.#
#.##..#
.......
0 0 4 6

Output:
10
```
The optimal route weaves around the walls in 10 steps.

## Approach
Run a breadth-first search from the starting cell. Initialize a queue with `(sr, sc, distance = 0)` and a `visited` grid. While the queue is not empty, pop the next cell and examine its four neighbors. For each neighbor that stays inside the grid, is an empty cell, and has not been visited before, mark it visited and enqueue with `distance + 1`. If the target cell is dequeued, return its distance immediately. If the queue empties without reaching the target, return `-1`.
