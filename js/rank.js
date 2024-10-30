// rank.js
const HANDTYPES = [
    "invalid hand",
    "high card",
    "one pair",
    "two pairs",
    "three of a kind",
    "straight",
    "flush",
    "full house",
    "four of a kind",
    "straight flush",
    "royal flush"
];

const RANKS = {
'2': 2,'3': 3,'4': 4,'5': 5,'6': 6,'7': 7,'8': 8,'9': 9,'T': 10,'J': 11,'Q': 12,'K': 13,'A': 14
};

/**
 * <h1>evalCard(cards : string[])</h1>
 * カードの配列を評価し、最も強い手役を特定する関数
 *
 * @param {string[]} cards - 評価するカードの配列（例: ["AS", "KS", "QS"]）
 * @returns {Object} 評価結果を含むオブジェクト
 * @property {number} handType - 手役の種類（HANDTYPESのインデックス）
 * @property {number} handRank - 手役のランク
 * @property {number} value - 手役の強さを示す一意の値
 * @property {string} handName - 手役の名前
 */
function evalCard(cards) {
    // 入力の検証
    if (!Array.isArray(cards) || ![2,3,5,6,7].includes(cards.length)) {
        return {
            handType: 0,
            handRank: 0,
            value: 0,
            handName: HANDTYPES[0]
        };
    }

    // カードのパース
    const parsedCards = cards.map(card => {
        const rank = card.slice(0, -1);
        const suit = card.slice(-1);
        return {
            rank: RANKS[rank],
            suit: suit
        };
    });

    // ランクとスートのカウント
    const rankCounts = {};
    const suitCounts = {};
    parsedCards.forEach(card => {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    const ranks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);
    const suits = Object.keys(suitCounts).filter(suit => suitCounts[suit] >= 5);

    // フラッシュの判定
    let flush = null;
    if (suits.length > 0) {
        flush = parsedCards
            .filter(card => card.suit === suits[0])
            .map(card => card.rank)
            .sort((a, b) => b - a);
    }

    // ストレートの判定
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
    let straight = findStraight(uniqueRanks);

    // ストレートフラッシュの判定
    let straightFlush = null;
    if (flush) {
        const uniqueFlushRanks = [...new Set(flush)].sort((a, b) => b - a);
        straightFlush = findStraight(uniqueFlushRanks);
    }

    // 手役の判定
    let handType = 1; // デフォルトはハイカード
    let handRank = 0;

    if (straightFlush) {
        handType = 9; // ストレートフラッシュ
        handRank = straightFlush[0];
    } else if (Object.values(rankCounts).includes(4)) {
        handType = 8; // フォーカード
        handRank = getHighestRankWithCount(rankCounts, 4);
    } else if (Object.values(rankCounts).includes(3) && Object.values(rankCounts).filter(count => count >= 2).length >= 2) {
        handType = 7; // フルハウス
        handRank = getHighestRankWithCount(rankCounts, 3) * 100 + getHighestRankWithCount(rankCounts, 2);
    } else if (flush) {
        handType = 6; // フラッシュ
        handRank = flush.slice(0, 5).reduce((acc, rank, idx) => acc + rank * Math.pow(16, 4 - idx), 0);
    } else if (straight) {
        handType = 5; // ストレート
        handRank = straight[0];
    } else if (Object.values(rankCounts).includes(3)) {
        handType = 4; // スリーカード
        handRank = getHighestRankWithCount(rankCounts, 3);
    } else if (Object.values(rankCounts).filter(count => count >= 2).length >= 2) {
        handType = 3; // ツーペア
        const pairs = Object.keys(rankCounts)
            .filter(rank => rankCounts[rank] >= 2)
            .map(Number)
            .sort((a, b) => b - a);
        handRank = pairs[0] * 100 + pairs[1];
    } else if (Object.values(rankCounts).includes(2)) {
        handType = 2; // ワンペア
        handRank = getHighestRankWithCount(rankCounts, 2);
    }

    // バリューの計算（handTypeを100000倍にしてhandRankを加算）
    const value = handType * 100000 + handRank;

    return {
        handType: handType,
        handRank: handRank,
        value: value,
        handName: HANDTYPES[handType]
    };
}

// ストレートを見つけるヘルパー関数
function findStraight(ranks) {
    if (ranks.length < 5) return null;
    // Aceを1として扱う場合を考慮
    const extendedRanks = [...ranks];
    if (ranks.includes(14)) {
        extendedRanks.push(1);
    }

    for (let i = 0; i <= extendedRanks.length - 5; i++) {
        let straightSeq = extendedRanks.slice(i, i + 5);
        let isSequential = true;
        for (let j = 0; j < straightSeq.length - 1; j++) {
            if (straightSeq[j] - straightSeq[j + 1] !== 1) {
                isSequential = false;
                break;
            }
        }
        if (isSequential) {
            return straightSeq;
        }
    }
    return null;
}

// 特定のカウントを持つ最高ランクを取得するヘルパー関数
function getHighestRankWithCount(rankCounts, count) {
    const ranks = Object.keys(rankCounts)
        .map(Number)
        .filter(rank => rankCounts[rank] === count)
        .sort((a, b) => b - a);
    return ranks[0] || 0;
}
