const STDH_JSON = './res/r_stdh.json';
let myHand = 'High Card';

const handRankingList = document.getElementById('hand-ranking-list').children;

document.getElementById('calc').addEventListener('click', async function() {
    // 入力値の取得
    let bet = parseFloat(document.getElementById('bet').value);
    let pot = parseFloat(document.getElementById('pot').value);
    let playerCount = parseInt(document.getElementById('player').value);

    // プレイヤーのハンド
    let playerCard1 = document.getElementById('player-card1').value.trim().toUpperCase();
    let playerCard2 = document.getElementById('player-card2').value.trim().toUpperCase();

    // コミュニティカード
    let communityCards = [];
    for (let i = 1; i <= 5; i++) {
        let card = document.getElementById(`community-card${i}`).value.trim().toUpperCase();
        if (card) {
            communityCards.push(card);
        }
    }

    // 手役の評価
    const playerHand = [playerCard1, playerCard2, ...communityCards];
    const result = evalCard(playerHand);
    // 手役に応じてリストのスタイルを変更
    Array.from(handRankingList).forEach(item => item.style.color = ''); // クリア
    console.log("HAND : " + result.handName);
    // 該当する手役の色を変更
    if (result.handType > 0 && result.handType < HANDTYPES.length) {
        document.getElementById(`rank${result.handType}`).style.color = 'var(--accent-color)';
    }

    // オッズの計算
    let amountToCall = bet;
    let totalPot = pot + bet;
    let potOdds = (amountToCall / totalPot) * 100;

    // 勝率の計算
    let winRate = await computeWinRate(playerCard1, playerCard2, communityCards, playerCount);
    // 最適なアクションの決定
    let bestChoice = winRate >= potOdds ? 'Call' : 'Fold';

    // 結果の表示
    document.getElementById('win-rate').innerText = winRate.toFixed(2);
    document.getElementById('odds').innerText = potOdds.toFixed(2);
    document.getElementById('best-choice').innerText = bestChoice;
});

async function computeWinRate(card1, card2, communityCards, playerCount) {
    if (communityCards.length < 3) {
        // フロップが出ていない場合はスターティングハンドの勝率を使用
        let startingHand = getStartingHandKey(card1, card2);
        let winRate = startingHandWinRates[startingHand]?.[playerCount];

        // カードの順番を入れ替えて再試行
        if (!winRate) {
            let reversedStartingHand = getStartingHandKey(card2, card1);
            winRate = startingHandWinRates[reversedStartingHand]?.[playerCount] || 0;
        }
        console.log("CARD : " + card1 + "," + card2);
        console.log("RATE : " + winRate);
        return winRate;
    } else {
        // フロップ以降の場合はモンテカルロシミュレーションを使用
        let winRate = await monteCarloSimulation(card1, card2, communityCards, playerCount);
        console.log("CARD : " + card1 + "," + card2 + "," + communityCards.join(","));
        console.log("RATE : " + winRate);
        return winRate;
    }
}

async function monteCarloSimulation(card1, card2, communityCards, playerCount) {
    const simulations = 100000; // シミュレーション回数を10万回に設定
    let wins = 0;

    // 使用済みカードをセットに追加
    let usedCards = new Set([card1, card2, ...communityCards]);

    // デッキの残りのカードを生成
    let deck = generateDeck();
    deck = deck.filter(card => !usedCards.has(card));
    for (let i = 0; i < simulations; i++) {
        // デッキをシャッフル
        shuffle(deck);

        // ターンとリバーを引く
        let remainingCommunityCards = [...communityCards];
        let deckIndex = 0;
        while (remainingCommunityCards.length < 5) {
            remainingCommunityCards.push(deck[deckIndex++]);
        }

        // 相手のハンドを生成
        let opponentHands = [];
        for (let j = 0; j < playerCount - 1; j++) {
            let opponentCard1 = deck[deckIndex++];
            let opponentCard2 = deck[deckIndex++];
            opponentHands.push([opponentCard1, opponentCard2]);
        }

        let myBestHand = evalCard([...remainingCommunityCards, card1, card2]);
        let isWin = true;
        for (let opponentHand of opponentHands) {
            let opponentBestHand = evalCard([...remainingCommunityCards, ...opponentHand]);
            let comparison = compareHands(myBestHand, opponentBestHand);
            if (comparison < 0) {
                isWin = false;
                break;
            } else if (comparison === 0) {
                isWin = false; // 引き分けの場合も勝ちにはカウントしない
                break;
            }
        }

        if (isWin) {
            wins++;
        }

        // 進行状況の表示（任意）
        if ((i + 1) % 10000 === 0) {
            // console.log(`Simulation ${i + 1}/${simulations}`);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    // 勝率の計算
    return (wins / simulations) * 100;
}

function generateDeck() {
    const suits = ['S', 'H', 'D', 'C'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push(rank + suit);
        }
    }
    return deck;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function compareHands(handA, handB) {
    if (handA.handType !== handB.handType) {
        return handA.handType - handB.handType;
    } else {
        if (handA.handRank !== handB.handRank) {
            return handA.handRank - handB.handRank;
        } else {
            return 0;
        }
    }
}

function getStartingHandKey(card1, card2) {
    let rank1 = card1.charAt(0);
    let rank2 = card2.charAt(0);
    let suited = card1.charAt(1) === card2.charAt(1) ? 's' : 'o';
    if (rank1 === rank2) {
        suited = 's';
    }
    let ranks = [rank1, rank2].join('');
    return ranks + suited;
}

// スターティングハンドの勝率データ
let startingHandWinRates = {};
fetch(STDH_JSON)
    .then(response => response.json())
    .then(data => {
        startingHandWinRates = data;
    })
    .catch(error => {
        console.error('Error loading JSON:', error);
    });

