export const DEFAULT_FIRST_HOUR = 8;
export const DEFAULT_LAST_HOUR = 19;

export type TimedSlot = {
  readonly id: string;
  readonly startMinutes: number;
  readonly durationMinutes: number;
};

export type HourRange = {
  readonly firstHour: number;
  readonly lastHour: number;
};

export type PlacedSlot<Slot extends TimedSlot> = {
  readonly slot: Slot;
  readonly lane: number;
  readonly laneCount: number;
  readonly cluster: number;
};

export const minutesOf = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const timeLabelOf = (minutes: number) => {
  const bounded = Math.max(0, Math.min(minutes, 24 * 60));
  return `${String(Math.floor(bounded / 60)).padStart(2, "0")}:${String(bounded % 60).padStart(2, "0")}`;
};

const endOf = (slot: TimedSlot) => slot.startMinutes + slot.durationMinutes;

export const hourRangeOf = (slots: readonly TimedSlot[]): HourRange => ({
  firstHour: Math.min(
    DEFAULT_FIRST_HOUR,
    ...slots.map(({ startMinutes }) => Math.floor(startMinutes / 60)),
  ),
  lastHour: Math.min(
    24,
    Math.max(DEFAULT_LAST_HOUR, ...slots.map((slot) => Math.ceil(endOf(slot) / 60))),
  ),
});

export const offsetOf = (minutes: number, range: HourRange, hourHeight: number) =>
  ((minutes - range.firstHour * 60) / 60) * hourHeight;

export const isWithin = (minutes: number, range: HourRange) =>
  minutes >= range.firstHour * 60 && minutes <= range.lastHour * 60;

const byStart = (left: TimedSlot, right: TimedSlot) =>
  left.startMinutes - right.startMinutes || right.durationMinutes - left.durationMinutes;

const clustersOf = <Slot extends TimedSlot>(slots: readonly Slot[]) =>
  slots.toSorted(byStart).reduce<{ slots: Slot[]; end: number }[]>((clusters, slot) => {
    const last = clusters.at(-1);
    if (last !== undefined && slot.startMinutes < last.end) {
      last.slots.push(slot);
      last.end = Math.max(last.end, endOf(slot));
      return clusters;
    }
    return [...clusters, { slots: [slot], end: endOf(slot) }];
  }, []);

const placeCluster = <Slot extends TimedSlot>(
  slots: readonly Slot[],
  cluster: number,
): PlacedSlot<Slot>[] => {
  const laneEnds: number[] = [];
  const lanes = slots.map((slot) => {
    const free = laneEnds.findIndex((end) => end <= slot.startMinutes);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = endOf(slot);
    return { slot, lane };
  });
  return lanes.map(({ slot, lane }) => ({ slot, lane, laneCount: laneEnds.length, cluster }));
};

export const placeSlots = <Slot extends TimedSlot>(slots: readonly Slot[]): PlacedSlot<Slot>[] =>
  clustersOf(slots).flatMap(({ slots: cluster }, index) => placeCluster(cluster, index));

export type CrowdedCluster<Slot extends TimedSlot> = {
  readonly cluster: number;
  readonly hidden: readonly Slot[];
  readonly startMinutes: number;
};

export const fitLanes = <Slot extends TimedSlot>(
  placed: readonly PlacedSlot<Slot>[],
  maxLanes: number,
) => {
  const isCrowded = ({ laneCount }: PlacedSlot<Slot>) => laneCount > maxLanes;
  const visible = placed
    .filter((placement) => !isCrowded(placement) || placement.lane < maxLanes - 1)
    .map((placement) => (isCrowded(placement) ? { ...placement, laneCount: maxLanes } : placement));
  const hidden = placed.filter(
    (placement) => isCrowded(placement) && placement.lane >= maxLanes - 1,
  );
  const crowded = [...new Set(hidden.map(({ cluster }) => cluster))].map((cluster) => {
    const slots = hidden
      .filter((placement) => placement.cluster === cluster)
      .map(({ slot }) => slot);
    return {
      cluster,
      hidden: slots,
      startMinutes: Math.min(...slots.map(({ startMinutes }) => startMinutes)),
    };
  });
  return { visible, crowded, maxLanes };
};
