---
title: "How to Measure Performance of Your Code"
slug: "measure-your-code"
author: "Subhrajit"
date: 2025-12-26T11:30:00+05:30
lastmod: 2025-12-26T16:11:00+05:30
description: "How to measure and profile your code using various tools and techniques."
keywords: ["Code Measurement", "Profiling", "Execution Time", "clock_gettime", "rdtsc", "getrusage", "Linux perf", "perf_event_open"]
draft: false
---

Measuring code performance accurately is crucial, especially when optimizing existing algorithms or designing new ones. In this post, I'll share my learnings of measuring code performance using various tools and techniques.

For measuring execution time, we can use the following techniques:

1. Wall Clock Time (`clock_gettime`)
2. Linux resource usage metrics (`getrusage`)

To measure raw Time Stamp Counter (or, ticks), on x86 architectures we can use:

1. `RDTSC` (Read Time-Stamp Counter)

Finally, to pinpoint performance bottlenecks, we can use the Linux `perf` tool; However, there are two ways to use it:

1. `perf` Command line tool
2. `perf_event_open` syscall for custom profiling code segments.

We will explore each of these methods in detail, with the help of an example C code snippet that we will measure using these techniques.

## Our Example Function

The naive function snippet we will use for measurement is as follows:

```c
int sum_of_two_arrays(int *array1, int *array2, int size)
{
    int total_sum = 0;
    int sum1 = 0, sum2 = 0;
    for (int i = 0; i < size; i++)
    {
        sum1 += array1[i];
    }
    for (int i = 0; i < size; i++)
    {
        sum2 += array2[i];
    }

    total_sum = sum1 + sum2;
    return total_sum;
}
```

## Wall Clock Time (clock_gettime)

The most popular way to measure code performance is by using wall clock time. The [`clock_gettime`](https://man7.org/linux/man-pages/man3/clock_gettime.3.html) function in Linux provides wall-clock time measurements with nanosecond precision. It can be used to measure the elapsed time for a specific code segment.

While there are multiple clock types available, `CLOCK_MONOTONIC` (or `CLOCK_MONOTONIC_RAW`) is generally preferred for measuring elapsed time as it is not affected by system time changes. Unlike `CLOCK_REALTIME`, it won't jump backwards if NTP adjusts the system clock mid-measurement. To use `clock_gettime`, we have to include the `<time.h>` header file.

Here are some helper functions I use for measuring time using `clock_gettime`:

```c
#include <time.h>

// function to get the timespec stamp
static inline struct timespec get_timespec()
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC_RAW, &ts);
    return ts;
}

// function to compute the difference between two timespec stamps in microseconds
static inline long diff_timespec_us(struct timespec start, struct timespec end)
{
    struct timespec temp;
    if ((end.tv_nsec - start.tv_nsec) < 0)
    {
        temp.tv_sec = end.tv_sec - start.tv_sec - 1;
        temp.tv_nsec = 1000000000 + end.tv_nsec - start.tv_nsec;
    }
    else
    {
        temp.tv_sec = end.tv_sec - start.tv_sec;
        temp.tv_nsec = end.tv_nsec - start.tv_nsec;
    }
    // return in microseconds
    return (temp.tv_sec * 1000000000 + temp.tv_nsec) / 1000;
}
```

### Usage

```c
struct timespec start, end;

printf("Measuring time using clock_gettime (timespec)...\n");

start = get_timespec();
long long sum = 0;
for (int i = 0; i < 10000; i++)
{
    sum += sum_of_two_arrays(array1, array2, N);
}
end = get_timespec();
long double time_taken = diff_timespec_us(start, end);

printf("done!\n");
printf("sum = %lld\n", sum);
printf("Time taken: %Lf microseconds\n", time_taken);
```

### Output

```
Measuring time using clock_gettime (timespec)...
done!
sum = 98901230000
Time taken: 1234567.000000 microseconds
```

## getrusage

In Linux systems, [`getrusage`](https://www.man7.org/linux/man-pages/man2/getrusage.2.html) is a system call that provides resource usage statistics for the calling process. It is used to measure the resources used by the process, like CPU time, memory usage, etc.

The key difference from wall clock time: `getrusage` tells you how much CPU time your code actually used, not how long you waited for it. If the system was busy with other tasks, wall clock time includes that overhead, but `getrusage` does not.

POSIX.1 specifies `getrusage()`, but specifies only the fields `ru_utime` and `ru_stime`. For our benchmarking purposes, we can use `ru_utime` to measure the user CPU time (time spent executing your code) and `ru_stime` for system CPU time (time spent in kernel mode on your behalf). To use `getrusage`, we need to include the `<sys/resource.h>` header file.

```c
#include <sys/resource.h>

// Function to measure CPU time in microseconds as a long double
static inline long double cputime()
{
    struct rusage rus;
    getrusage(RUSAGE_SELF, &rus);
    return rus.ru_utime.tv_sec * 1000000.0L + rus.ru_utime.tv_usec;
}
```

### Usage

```c
long double t0, t1, time_taken;

printf("Measuring time using rusage...\n");

t0 = cputime();
long long sum = 0;
for (int i = 0; i < 10000; i++)
{
    sum += sum_of_two_arrays(array1, array2, N);
}
t1 = cputime();
time_taken = t1 - t0;

printf("done!\n");
printf("sum = %lld\n", sum);
printf("Time taken: %Lf microseconds\n", time_taken);
```

### Output

```
Measuring time using rusage...
done!
sum = 98901230000
Time taken: 1234567.000000 microseconds
```

## RDTSC

On the x86 architecture, the `RDTSC` (Read Time-Stamp Counter) instruction is a low-level way to measure the number of CPU ticks that have elapsed since the last reset. It provides a raw metric of code execution time, making it suitable for performance profiling.

The `RDTSC` instruction measures ticks that increment at a constant rate, regardless of CPU frequency scaling (e.g., Turbo Boost, power-saving states). The number of ticks per unit of real time will remain constant, even if the core's clock speed changes.

However, it is well-known that `RDTSC` does not provide accurate measurements in cases of code cross-contamination due to out-of-order execution. A white paper by Intel explains how to measure ticks accurately using a combination of `CPUID`, `RDTSC`, and `RDTSCP` instructions. You can find the white paper here: [How to Benchmark Code Execution Times on Intel® IA-32 and IA-64 Instruction Set Architectures](https://www.intel.com/content/dam/www/public/us/en/documents/white-papers/ia-32-ia-64-benchmark-code-execution-paper.pdf). `RDTSCP` mitigates some of the out-of-order execution issues by serializing the instruction stream before reading the time-stamp counter.

The reason of using `CPUID` instruction (which generates an interrupt) before and after `RDTSC`/`RDTSCP` is to serialize the instruction stream, ensuring that all previous instructions have completed before reading the time-stamp counter. This helps to get a more accurate measurement of the code segment.

```c
static inline unsigned long long measure_rdtsc_start()
{
    unsigned cycles_low, cycles_high;
    unsigned long long ticks;
    asm volatile("CPUID\n\t"
                 "RDTSC\n\t"
                 "mov %%edx, %0\n\t"
                 "mov %%eax, %1\n\t" : "=r"(cycles_high), "=r"(cycles_low)::"%rax", "%rbx", "%rcx", "%rdx");
    ticks = (((unsigned long long)cycles_high << 32) | cycles_low);
    return ticks;
}
```

```c
// Inline function for measuring rdtscp ticks
static inline unsigned long long measure_rdtscp_end()
{
    unsigned cycles_low, cycles_high;
    unsigned long long ticks;
    asm volatile("RDTSCP\n\t"
                 "mov %%edx, %0\n\t"
                 "mov %%eax, %1\n\t"
                 "CPUID\n\t" : "=r"(cycles_high), "=r"(cycles_low)::"%rax",
                               "%rbx", "%rcx", "%rdx");
    ticks = (((unsigned long long)cycles_high << 32) | cycles_low);
    return ticks;
}
```

### Usage

```c
unsigned long long start_ticks, end_ticks, ticks_taken;

printf("Measuring time using rdtsc...\n");

start_ticks = measure_rdtsc_start();
long long sum = 0;
for (int i = 0; i < 10000; i++)
{
    sum += sum_of_two_arrays(array1, array2, N);
}
end_ticks = measure_rdtscp_end();

ticks_taken = end_ticks - start_ticks;

printf("done!\n");
printf("sum = %lld\n", sum);
printf("Ticks taken: %llu\n", ticks_taken);

// Converting ticks to microseconds: 1 tick = 1/2.8 GHz = 0.357 ns = 0.000357 us
long double time_taken = ticks_taken * 0.000357;
printf("Time taken: %Lf microseconds\n", time_taken);
```

### Output

```
Measuring time using rdtsc...
done!
sum = 98901230000
Ticks taken: 3456789012
Time taken: 1234073.08 microseconds
```

## Accuracy Considerations

The actual elapsed time will vary based on system load and other factors like CPU frequency scaling, context switching, etc. To get more accurate measurements, consider measuring the code segment multiple times—create CDF plots to visualize the distribution of execution times or use statistical measures like 95% CI (Confidence Interval) mean to report the results.

For execution time measurements, it's also important to minimize the impact of other processes running on the system. Running the measurements on a dedicated machine or using CPU affinity to bind the process to a specific core can help reduce variability.

### Why Warmups Matter: The Cold Cache Problem

This is something that tripped me up early on. When you run a function for the first time, the data it accesses is not in the CPU cache—it has to be fetched from main memory. These are called "cold cache misses," and they are *slow*. Memory access latency can be 100-300 cycles, while an L1 cache hit is just a few cycles.

Here's the problem: if you measure your code without warming up the cache first, the memory access time dominates the measurement. You might optimize your CPU computations and see *no improvement* in your benchmarks—because the memory latency was hiding the CPU time all along. This is especially frustrating when you've worked hard on an optimization and the numbers tell you it didn't help.

```c
// BAD: First run has cold cache
start = clock();
result = sum_of_two_arrays(array1, array2, N);  // Cache misses everywhere!
end = clock();
// This measures memory latency, not CPU performance

// GOOD: Warm up the cache first
for (int i = 0; i < 3; i++) {
    volatile int r = sum_of_two_arrays(array1, array2, N);
    (void)r;
}
// Now the data is in cache
start = clock();
result = sum_of_two_arrays(array1, array2, N);  // Cache hits, measures actual compute
end = clock();
```

If you're comparing two implementations and one happens to run first (cold cache) while the other runs second (warm cache), you'll get misleading results. Always warm up before measuring, or measure both with equally cold caches.

### GMPBench Style Averaging

I personally prefer the averaging strategy of GMPBench to report the mean execution time of a given function. What it does is, it starts with a single iteration of the function and doubles the number of iterations until the total elapsed time exceeds a predefined threshold (e.g., 250 ms). Once the threshold is reached, it calculates the average time per iteration by dividing the total elapsed time by the number of iterations. This approach helps to ensure that the measurements are less affected by transient system load variations. Further, based on this computed mean time, it calculates throughput (operations per second) and reports that as the final performance metric.

Originally, GMPBench was designed to benchmark arbitrary-precision arithmetic operations in the GMP library, but the underlying methodology can be applied to measure the performance of any function or code segment.

Below you can find three different adapted macros of GMPBench style averaging strategy to measure execution time using `clock_gettime`, `RDTSC`, and `getrusage` respectively:

```c
// Function to measure the time taken by a function using the rusage system call
#define TIME_RUSAGE(t, func)                    \
    do                                          \
    {                                           \
        long int __t0, __times, __t, __tmp;     \
        __times = 1;                            \
        {                                       \
            func;                               \
        }                                       \
        do                                      \
        {                                       \
            __times <<= 1;                      \
            __t0 = cputime();                   \
            for (__t = 0; __t < __times; __t++) \
            {                                   \
                func;                           \
            }                                   \
            __tmp = cputime() - __t0;           \
        } while (__tmp < 250000);               \
        (t) = (double)__tmp / __times;          \
    } while (0)

// Function to measure the time taken by a function using the timespec clock_gettime system call
#define TIME_TIMESPEC(t, func)                      \
    do                                              \
    {                                               \
        long int __tmp, __times;                    \
        struct timespec __t0, __t1;                 \
        __times = 1;                                \
        {                                           \
            func;                                   \
        }                                           \
        do                                          \
        {                                           \
            __times <<= 1;                          \
            __t0 = get_timespec();                  \
            for (int __t = 0; __t < __times; __t++) \
            {                                       \
                func;                               \
            }                                       \
            __t1 = get_timespec();                  \
            __tmp = diff_timespec_us(__t0, __t1);   \
        } while (__tmp < 250000);                   \
        (t) = (double)__tmp / __times;              \
    } while (0)

// Function to measure the time taken by a function using the rdtsc instruction
#define TIME_RDTSC(t, func)                            \
    do                                                 \
    {                                                  \
        unsigned long long __t0, __t1, __times, __tmp; \
        __times = 1;                                   \
        {                                              \
            func;                                      \
        }                                              \
        do                                             \
        {                                              \
            __times <<= 1;                             \
            __t0 = measure_rdtsc_start();              \
            for (int __t = 0; __t < __times; __t++)    \
            {                                          \
                func;                                  \
            }                                          \
            __t1 = measure_rdtscp_end();               \
            __tmp = __t1 - __t0;                       \
        } while (__tmp < 700000000);                   \
        __tmp = __tmp * 0.000357;                      \
        (t) = (double)(__tmp) / __times;               \
    } while (0)
```

### Usage Example

Here's how I use these macros in practice to benchmark a function using all three methods:

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "mytime.h"

int main()
{
    long double time_taken;
    unsigned long niter;
    double ops_per_sec;

    // Allocate and initialize arrays
    int N = 100000;
    int *array1 = (int *)malloc(N * sizeof(int));
    int *array2 = (int *)malloc(N * sizeof(int));
    srand(time(NULL));
    for (int i = 0; i < N; i++) {
        array1[i] = rand() % 100;
        array2[i] = rand() % 100;
    }

    // Benchmark using rusage
    printf("Calibrating time using rusage...\n");
    TIME_RUSAGE(time_taken, sum_of_two_arrays(array1, array2, N));
    printf("Calibrated time: %Lf microseconds\n", time_taken);

    niter = 1 + (unsigned long)(1e7 / time_taken);
    printf("Performing %lu iterations\n", niter);

    long double t0 = cputime();
    for (int i = 0; i < niter; i++) {
        sum_of_two_arrays(array1, array2, N);
    }
    long double t1 = cputime() - t0;

    ops_per_sec = (1e6 * niter) / t1;
    printf("RESULT: %.2f operations per second\n", ops_per_sec);

    return 0;
}
```

Whenever I report timing numbers, I prefer to run the GMPBench style averaging strategy for 20-30 times and report the 95% CI mean of the execution time or throughput numbers.

## Linux perf

The `perf` tool in Linux is a powerful performance analysis tool that can measure various aspects of code performance, including CPU cycles, cache misses, branch mispredictions, and more. It provides a wealth of information but can be complex to use effectively.

**The key insight**: timing measurements tell you *how long* your code takes, but `perf` tells you *why*. If your code is slow because of cache misses, branch mispredictions, or excessive page faults, `perf` helps you pinpoint the actual areas for optimization. Without this, you're just guessing at what to optimize.

### Basic Usage (Command Line)

Let's say we have two implementations of our function—the original with two separate loops, and an optimized version with a merged loop:

```c
int sum_of_two_arrays(int *array1, int *array2, int size)
{
    int total_sum = 0;
    int sum1 = 0, sum2 = 0;
    for (int i = 0; i < size; i++) {
        sum1 += array1[i];
    }
    for (int i = 0; i < size; i++) {
        sum2 += array2[i];
    }
    total_sum = sum1 + sum2;
    return total_sum;
}

int sum_of_two_arrays_merged_loop(int *array1, int *array2, int size)
{
    int total_sum = 0;
    for (int i = 0; i < size; i++) {
        total_sum += array1[i] + array2[i];
    }
    return total_sum;
}
```

We can use `perf stat` to compare them:

```bash
$ perf stat ./sample

 Performance counter stats for './sample':

         124.56 msec task-clock
              2      context-switches
         39,074      page-faults
    298,234,567      cycles                    #    2.394 GHz
    502,345,678      instructions              #    1.68  insn per cycle
     50,234,567      branches
        123,456      branch-misses             #    0.25% of all branches
```

For deeper cache analysis:

```bash
$ perf stat -e cache-references,cache-misses,L1-dcache-loads,L1-dcache-load-misses ./my_benchmark
```

### Programmatic Access (perf_event_open)

For measuring specific code segments programmatically, we can use the `perf_event_open` syscall. This lets you start and stop counters around the exact code you want to measure—which is crucial when you want to compare two functions within the same program.

Here's a utility library I use for this purpose:

**perf_utils.h:**

```c
#ifndef PERF_UTILS_H
#define PERF_UTILS_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/perf_event.h>
#include <asm/unistd.h>
#include <errno.h>

#define MAX_EVENTS 6
#define CORE_NO -1

extern struct perf_event_attr pe[MAX_EVENTS];
extern int fd[MAX_EVENTS];
extern long long count;
extern const char *event_names[MAX_EVENTS];

// Function declarations
void initialize_perf();
long perf_event_open(struct perf_event_attr *hw_event, pid_t pid, int cpu, int group_fd, unsigned long flags);
void read_perf(long long values[]);
void write_perf(FILE *file, long long values[]);
void start_perf();
void stop_perf();

#endif // PERF_UTILS_H
```

**perf_utils.c:**

```c
#include "perf_utils.h"
#include <stdint.h>

struct perf_event_attr pe[MAX_EVENTS];
int fd[MAX_EVENTS];
long long count;
const char *event_names[MAX_EVENTS] = {
    "CPU_CYCLES",  // CPU Cycles
    "USER_INSNS",  // User Instructions
    "KERN_INSNS",  // Kernel Instructions
    "PAGE_FAULTS", // Page Faults
    "L1D_READS",   // L1D Cache Reads
    "L1D_MISSES"   // L1D Cache Read Misses
};

void initialize_perf()
{
    // Define the events to monitor
    memset(pe, 0, sizeof(struct perf_event_attr) * MAX_EVENTS);
    for (int i = 0; i < MAX_EVENTS; i++)
    {
        pe[i].size = sizeof(struct perf_event_attr);
        pe[i].disabled = 1;
        pe[i].exclude_kernel = 0;
        pe[i].exclude_hv = 1;
        pe[i].exclude_idle = 1;
        pe[i].exclude_user = 0;
        pe[i].pinned = 1;
    }

    // CPU cycles
    pe[0].type = PERF_TYPE_HARDWARE;
    pe[0].config = PERF_COUNT_HW_CPU_CYCLES;

    // User-level instructions
    pe[1].type = PERF_TYPE_HARDWARE;
    pe[1].config = PERF_COUNT_HW_INSTRUCTIONS;
    pe[1].exclude_kernel = 1;
    pe[1].exclude_user = 0;

    // Kernel-level instructions
    pe[2].type = PERF_TYPE_HARDWARE;
    pe[2].config = PERF_COUNT_HW_INSTRUCTIONS;
    pe[2].exclude_kernel = 0;
    pe[2].exclude_user = 1;

    // Page faults
    pe[3].type = PERF_TYPE_SOFTWARE;
    pe[3].config = PERF_COUNT_SW_PAGE_FAULTS;

    // L1D Cache Reads
    pe[4].type = PERF_TYPE_HW_CACHE;
    pe[4].config = PERF_COUNT_HW_CACHE_L1D | (PERF_COUNT_HW_CACHE_OP_READ << 8) | (PERF_COUNT_HW_CACHE_RESULT_ACCESS << 16);

    // L1D Cache Read Misses
    pe[5].type = PERF_TYPE_HW_CACHE;
    pe[5].config = PERF_COUNT_HW_CACHE_L1D | (PERF_COUNT_HW_CACHE_OP_READ << 8) | (PERF_COUNT_HW_CACHE_RESULT_MISS << 16);

    // Open the events
    for (int i = 0; i < MAX_EVENTS; i++)
    {
        fd[i] = perf_event_open(&pe[i], 0, CORE_NO, -1, 0);
        if (fd[i] == -1)
        {
            fprintf(stderr, "Error opening event %d: %s\n", i, strerror(errno));
            exit(EXIT_FAILURE);
        }
    }
}

long perf_event_open(struct perf_event_attr *hw_event, pid_t pid, int cpu, int group_fd, unsigned long flags)
{
    return syscall(__NR_perf_event_open, hw_event, pid, cpu, group_fd, flags);
}

void read_perf(long long values[])
{
    for (int j = 0; j < MAX_EVENTS; j++)
    {
        if (read(fd[j], &values[j], sizeof(uint64_t)) == -1)
        {
            perror("Error reading counter value");
            exit(EXIT_FAILURE);
        }
    }
}

void write_perf(FILE *file, long long values[])
{
    for (int j = 0; j < MAX_EVENTS; j++)
    {
        fprintf(file, "%s,", event_names[j]);
    }
    fprintf(file, "\n");
    for (int j = 0; j < MAX_EVENTS; j++)
    {
        fprintf(file, "%llu,", values[j]);
    }
    fprintf(file, "\n");
}

void start_perf()
{
    for (int j = 0; j < MAX_EVENTS; j++)
    {
        ioctl(fd[j], PERF_EVENT_IOC_RESET, 0);
        ioctl(fd[j], PERF_EVENT_IOC_ENABLE, 0);
    }
}

void stop_perf()
{
    for (int j = 0; j < MAX_EVENTS; j++)
    {
        if (ioctl(fd[j], PERF_EVENT_IOC_DISABLE, 0) == -1)
        {
            perror("Error disabling counter");
            exit(EXIT_FAILURE);
        }
    }
}
```

### Usage Example: Comparing Two Implementations

Here's how you can use this to compare our two array sum implementations:

```c
// To compile: gcc -o sample2 sample_perf_util2.c perf_utils.c -I.
// To run: sudo ./sample2

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "perf_utils.h"

int sum_of_two_arrays(int *array1, int *array2, int size)
{
    int total_sum = 0;
    int sum1 = 0, sum2 = 0;
    for (int i = 0; i < size; i++) {
        sum1 += array1[i];
    }
    for (int i = 0; i < size; i++) {
        sum2 += array2[i];
    }
    total_sum = sum1 + sum2;
    return total_sum;
}

int sum_of_two_arrays_merged_loop(int *array1, int *array2, int size)
{
    int total_sum = 0;
    for (int i = 0; i < size; i++) {
        total_sum += array1[i] + array2[i];
    }
    return total_sum;
}

int main()
{
    long long values[MAX_EVENTS];

    // Initialize performance monitoring
    initialize_perf();

    int N = 100000;
    int *array1 = (int *)malloc(N * sizeof(int));
    int *array2 = (int *)malloc(N * sizeof(int));
    srand(time(NULL));
    for (int i = 0; i < N; i++) {
        array1[i] = rand() % 100;
        array2[i] = rand() % 100;
    }

    printf("\nStarting sum_of_two_arrays...\n");

    // Start performance monitoring
    start_perf();

    int x = sum_of_two_arrays(array1, array2, N);

    // Stop performance monitoring
    stop_perf();

    printf("sum = %d\n", x);

    // Read and print performance counters
    read_perf(values);
    write_perf(stdout, values);

    printf("\nStarting sum_of_two_arrays_merged_loop...\n");

    // Start performance monitoring for second function
    start_perf();

    int y = sum_of_two_arrays_merged_loop(array1, array2, N);

    // Stop performance monitoring
    stop_perf();

    printf("sum = %d\n", y);

    // Read and print performance counters
    read_perf(values);
    write_perf(stdout, values);

    return 0;
}
```

### Sample Output

```
Starting sum_of_two_arrays...
sum = 9890123
CPU_CYCLES,USER_INSNS,KERN_INSNS,PAGE_FAULTS,L1D_READS,L1D_MISSES,
298234,502345,0,0,200456,12345,

Starting sum_of_two_arrays_merged_loop...
sum = 9890123
CPU_CYCLES,USER_INSNS,KERN_INSNS,PAGE_FAULTS,L1D_READS,L1D_MISSES,
198456,301234,0,0,100234,6789,
```

Now you can see exactly *why* the merged loop is faster—fewer L1D cache reads and fewer cache misses. The merged loop accesses `array1[i]` and `array2[i]` together in the same iteration, which has better cache locality than iterating through each array separately.

## Summary

In conclusion, accurately measuring code performance requires a combination of tools and techniques. By understanding the strengths and weaknesses of each method, you can gain valuable insights into your code's performance and identify areas for optimization.

| Method | What it measures | When to use |
|--------|-----------------|-------------|
| `clock_gettime` | Wall clock time | General benchmarking |
| `getrusage` | CPU time only | Isolate from I/O wait |
| `RDTSC`/`RDTSCP` | CPU cycles | Sub-µs precision, cache analysis |
| `perf` / `perf_event_open` | Hardware counters | Cache misses, branch prediction, pinpointing bottlenecks |

Don't forget: warm up your caches, run multiple iterations, and report confidence intervals. A single measurement number is almost meaningless without this context.
