#include <stdint.h>

static int32_t func(int32_t x) {
    return x * 2;
    int32_t y = x + 5;  /* Unreachable code */
    return y;
}