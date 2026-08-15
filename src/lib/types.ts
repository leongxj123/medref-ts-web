export type DrugRow = [
  id: number,
  generic: string,
  brand: string,
  pinyin: string,
  approval: string,
  klass: string,
  nature: string,
  mfr: string,
  spec: string,
  diseases: string,
];

export type WikiRow = [
  id: number,
  name: string,
  dept: string,
  sub: string,
  way: string,
  yibao: string,
  symptoms: string,
];

export type DrugRef = {
  label: string;
  kind: "generic" | "search";
  target: string;
};

export type DrugDetail = {
  id: number;
  title: string;
  generic_name: string;
  brand_name: string;
  pinyin: string;
  approval_no: string;
  classification: string;
  manufacturer: string;
  nature: string;
  spec: string;
  diseases: string[];
  sections: Record<string, string>;
};

export type WikiDetail = {
  id: number;
  name: string;
  dept: string;
  sub: string;
  category: string[];
  cure_department: string[];
  yibao_status: string;
  get_prob: string;
  easy_get: string;
  get_way: string;
  cure_way: string[];
  cure_lasttime: string;
  cured_prob: string;
  cost_money: string;
  symptom: string[];
  check: string[];
  acompany: string[];
  common_drug: DrugRef[];
  recommand_drug: DrugRef[];
  drug_detail: DrugRef[];
  do_eat: string[];
  not_eat: string[];
  recommand_eat: string[];
  sections: Record<string, string>;
};

export type Meta = {
  total: number;
  generic: number;
  brand: number;
  wiki: number;
  classes: string[];
  natures: string[];
  wikiDepts: string[];
  drugShard: number;
  wikiShard: number;
  built_at: string;
};

export type DrugItem = {
  id: number;
  generic_name: string;
  brand_name: string;
  pinyin: string;
  approval_no: string;
  classification: string;
  nature: string;
  manufacturer: string;
  spec: string;
  diseases: string;
};

export const DISCLAIMER =
  "数据仅供学习参考，不能替代医师或药师指导。用药与诊疗请以最新法定说明书和临床规范为准。";

export const SECTION_LABELS: Record<string, string> = {
  indications: "适应症",
  dosage: "用法用量",
  adverse: "不良反应",
  contraindication: "禁忌",
  precautions: "注意事项",
  interactions: "药物相互作用",
  pregnancy: "孕妇及哺乳期妇女用药",
  children: "儿童用药",
  elderly: "老人用药",
  ingredients: "主要成份",
  appearance: "性状",
  pharmacology: "药理毒理",
  pk: "药代动力学",
  storage: "贮藏",
  expiry: "有效期",
  desc: "概述",
  cause: "病因",
  prevent: "预防",
};

export const SECTION_TONE: Record<string, string> = {
  adverse: "warn",
  contraindication: "danger",
  precautions: "warn",
  interactions: "warn",
};
