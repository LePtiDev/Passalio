import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { customersFr } from "@/contexts/customers/fr";

export const openEquipmentKinds = async (user: UserEvent) => {
  await user.click(await screen.findByRole("combobox", { name: customersFr.equipmentForm.kind }));
  return screen.findByRole("listbox");
};

export const chooseEquipmentKind = async (user: UserEvent, kind: string) => {
  await openEquipmentKinds(user);
  await user.click(screen.getByRole("option", { name: kind }));
};
