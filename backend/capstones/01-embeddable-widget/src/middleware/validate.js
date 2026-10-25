// Wraps a zod schema so every route gets identical, clean 4xx behavior on
// bad input — the server never trusts the client, and it never 500s on
// input it merely dislikes.
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = { validateBody };
