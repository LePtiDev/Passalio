export const inSequence = async <Item>(
  items: readonly Item[],
  step: (item: Item) => Promise<void>,
): Promise<void> =>
  items.reduce(async (previous, item) => {
    await previous;
    await step(item);
  }, Promise.resolve());
