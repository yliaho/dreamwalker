import { InjectionKey, provide } from "vue";
import { DatasBin } from "./lib/datas-bin";
import { NaiveBinaryReader } from "./lib/naive-binary-reader";

export const datasBin = new DatasBin(NaiveBinaryReader);

export const DatasBinKey: InjectionKey<DatasBin> = Symbol("datasbin");

export function useDatasBin(datasBin: DatasBin): DatasBin {
  provide(DatasBinKey, datasBin);

  return datasBin;
}
