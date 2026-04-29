import { useLocalStorage } from "./use-local-storage";

export type ListStatus = "quiero_jugar" | "jugando" | "completado" | "abandonado";

export type ListItem = {
  juegoId: number;
  estado: ListStatus;
  horasJugadas: number;
  ratingPersonal: number;
  notaPersonal: string;
  fechaAgregado: string;
};

export function useList() {
  const [list, setList] = useLocalStorage<ListItem[]>("gr_lista", []);

  const addToList = (juegoId: number, estado: ListStatus = "quiero_jugar") => {
    if (!list.find((item) => item.juegoId === juegoId)) {
      setList([
        ...list,
        {
          juegoId,
          estado,
          horasJugadas: 0,
          ratingPersonal: 0,
          notaPersonal: "",
          fechaAgregado: new Date().toISOString(),
        },
      ]);
    } else {
      updateItem(juegoId, { estado });
    }
  };

  const updateItem = (juegoId: number, updates: Partial<ListItem>) => {
    setList(
      list.map((item) =>
        item.juegoId === juegoId ? { ...item, ...updates } : item
      )
    );
  };

  const removeFromList = (juegoId: number) => {
    setList(list.filter((item) => item.juegoId !== juegoId));
  };

  const getItem = (juegoId: number) => list.find((item) => item.juegoId === juegoId);

  return { list, addToList, updateItem, removeFromList, getItem };
}
