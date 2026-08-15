/** Runtime filter for author names leaked into symptom tags (mirrors export_lib.py). */

const SURNAMES = new Set(
  (
    "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁邓单杭洪包诸左石崔吉钮龚程邢滑裴陆荣翁荀羊於惠甄家封芮储靳井段富巫乌焦巴弓谷车侯全班秋仲伊宫宁仇栾甘厉祖武符刘景詹束龙叶司黎薄白蒲从鄂索赖卓蔺屠蒙池乔阴翟谭贡劳姬冉桑桂牛寿通边扈燕冀浦尚农温庄晏柴瞿阎闫充慕连茹习宦艾鱼容向古易慎戈廖终居衡步都耿满弘匡国文寇广禄阙欧沃利蔚越隆师巩聂晁勾敖融冷辛阚那简饶空曾毋沙鞠须丰巢关蒯相查后荆红游竺权逯盖益迟佘佴赏南墨哈谯笪年爱阳佟言福"
  ).split("")
);

const STRONG_MEDICAL = new Set(
  "痛痒炎泻咳喘闷晕吐血尿汗脉搏疹斑疮癣痹厥痉颤搐瘫聋疸绀痰肿烧热寒酸麻秘胀啰嗽呕痢痫瘟疽瘘痈痞瘕痿瘀涩濡芤弦".split("")
);

const KEEP = new Set([
  "发热",
  "头痛",
  "头晕",
  "胸痛",
  "胸闷",
  "咳嗽",
  "乏力",
  "紫绀",
  "低热",
  "抽搐",
  "惊厥",
  "水肿",
  "黄疸",
  "腹痛",
  "腹泻",
  "呕吐",
  "恶心",
  "便秘",
  "皮疹",
  "瘙痒",
  "失眠",
  "心悸",
  "气促",
  "咯血",
  "血尿",
  "昏迷",
  "眩晕",
  "耳鸣",
  "消瘦",
  "肥胖",
  "多饮",
  "多尿",
  "便血",
  "呕血",
  "鼻塞",
  "流涕",
  "咽痛",
  "口干",
  "盗汗",
  "畏寒",
  "寒战",
  "贫血",
  "尿频",
  "尿急",
  "尿痛",
  "腰痛",
  "背痛",
  "关节痛",
  "肌痛",
  "麻木",
  "瘫痪",
  "失语",
  "复视",
  "耳聋",
  "牙痛",
  "龈肿",
  "口臭",
  "反酸",
  "嗳气",
  "腹胀",
  "便溏",
  "里急",
  "后重",
  "闭经",
  "痛经",
  "白带",
  "脱发",
  "多汗",
  "早搏",
  "落枕",
  "呛奶",
  "低烧",
  "促脉",
  "假孕",
  "假笑",
  "凸甲",
  "凹甲",
  "副耳",
  "口甜",
  "嗜盐",
  "失声",
  "失盐",
  "头沉",
  "恐风",
  "抱癖",
  "淤青",
  "牢脉",
  "畏热",
  "痘疤",
  "痰饮",
  "结脉",
  "绝汗",
  "肝虚",
  "肾寒",
  "脐突",
  "脚臭",
  "脾湿",
  "腿痛",
  "虚胖",
  "虚脉",
  "迟脉",
  "酮尿",
  "长脉",
  "闭症",
  "骨痒",
  "鼻酸",
  "超雄",
  "超雌",
  "恶寒",
  "昏睡",
  "食欲不振",
]);

const MEDICAL_HINTS = new Set(
  (
    "痛痒酸麻热寒烧肿炎泻咳喘闷晕吐血尿汗脉搏疹斑疮癣痹厥痉颤抽搐瘫聋疸绀痰促迟虚湿盐声风孕甲甜沉疤突臭胖酮症枕奶口鼻头胸腹腰腿脚肝脾肾心肺骨痘笑癖青雄雌秘斑胀高"
  ).split("")
);

function isHan(ch: string) {
  const c = ch.codePointAt(0) || 0;
  return c >= 0x4e00 && c <= 0x9fff;
}

function hasStrongMedical(token: string) {
  for (const ch of token) if (STRONG_MEDICAL.has(ch)) return true;
  return false;
}

function hasMedicalHint(token: string) {
  for (const ch of token) if (MEDICAL_HINTS.has(ch)) return true;
  return false;
}

export function looksLikePersonName(token: string) {
  if (!token || token.length < 2 || token.length > 3) return false;
  if (KEEP.has(token)) return false;
  for (const ch of token) if (!isHan(ch)) return false;
  if (hasStrongMedical(token)) return false;
  if (token.length === 2) return SURNAMES.has(token[0]) && !hasMedicalHint(token);
  if (SURNAMES.has(token[0])) return true;
  // 首字撞弱医学字、后两字无提示 → 人名（迟明华）
  if (MEDICAL_HINTS.has(token[0]) && ![...token.slice(1)].some((ch) => MEDICAL_HINTS.has(ch))) return true;
  return !hasMedicalHint(token);
}

export function cleanSymptomTags(tokens: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tokens) {
    const t = (raw || "").trim();
    if (!t || seen.has(t)) continue;
    if (looksLikePersonName(t)) continue;
    // 两字无医学提示且不在白名单 → 署名噪声
    if (t.length === 2 && !KEEP.has(t) && !hasMedicalHint(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
