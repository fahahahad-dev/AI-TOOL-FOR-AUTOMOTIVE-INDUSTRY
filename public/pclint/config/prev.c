#include <stdint.h>
#include <stddef.h>

/* Global variable for safe side effects */
static int32_t g_counter = 0;

/* Prototypes */
// static void fn(void);
// static void g(void);

static void fn(void)
{
    int32_t a = 0;
    // g_counter += a + 1; /* side effect: updates global */
}

static void g(void)
{
    char buffer[512];
    char *p = buffer;
    char *q = p;

    q[0] = 'A';
    p[1] = 'B';

    /* side effect: safely add chars with explicit promotion */
    g_counter += ((int32_t)q[0]) + ((int32_t)p[1]);
}

int32_t main(void)
{
    fn(); /* now has side effects */
    g();  /* now has side effects */
    return g_counter; /* return fixed-width type, no plain int */
}
