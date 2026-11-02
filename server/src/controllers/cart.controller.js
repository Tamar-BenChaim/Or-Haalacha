export function createCartController({ cartService }) {
  return {
    async quote(req, res) {
      res.set('Cache-Control', 'no-store').json(await cartService.quote(req.validated.body.items));
    },
  };
}
