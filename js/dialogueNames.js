/** Diyalog isim etiketleri — kız Aleyna, erkek Vahit */
export const CHARACTER_NAMES = {
  girl: 'Aleyna',
  boy: 'Vahit',
};

export function getSpeakerName(from) {
  return from === 'girl' ? CHARACTER_NAMES.girl : CHARACTER_NAMES.boy;
}
