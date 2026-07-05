export interface HistoryItem {
  year: string
  date?: string
  title: string
  description: string
}

export const historyItems: HistoryItem[] = [
  {
    year: '2012',
    date: '12.28-29',
    title: '첫 단독콘서트',
    description: '홍이삭과 친구들',
  },
  {
    year: '2013',
    date: '11',
    title: '유재하 음악경연대회',
    description: "자작곡 '봄아'로 동상 수상",
  },
  {
    year: '2015',
    date: '09.12',
    title: '시간이 지나도',
    description: 'EP 발매 앵콜 콘서트',
  },
  {
    year: '2019',
    title: '슈퍼밴드',
    description: '팀 모네로 TOP4',
  },
  {
    year: '2020',
    title: '다시 만난 날들',
    description: '주연 및 음악감독 참여',
  },
  {
    year: '2022',
    date: '09.03-04',
    title: 'STAY',
    description: '홍이삭 단독 콘서트',
  },
  {
    year: '2024',
    title: '싱어게인3 우승',
    description: '58호 가수에서 최종 우승까지',
  },
  {
    year: '2025',
    date: '03.14-16',
    title: 'THE LOVERS',
    description: '홍이삭 콘서트',
  },
  {
    year: '2025',
    date: '11.08-09',
    title: 'Toasted Tunes',
    description: 'LIVE SESSION',
  },
  {
    year: '2026',
    date: '05.23-25',
    title: 'Sway',
    description: '홍이삭 콘서트',
  },
  {
    year: '2026',
    title: 'Castle In The Air',
    description: '새 EP와 라이브',
  },
]
