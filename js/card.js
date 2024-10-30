let currentInput = null;
let selectedCards = [];

// 入力フィールドにクリックイベントを追加
document.addEventListener('DOMContentLoaded', function() {
    const cardInputs = document.querySelectorAll('.card-i');
    cardInputs.forEach(input => {
        input.addEventListener('click', function(e) {
            e.preventDefault(); // デフォルトの入力動作を防ぐ
            currentInput = this;
            openCardSelector();
        });

        // フォーカス時にも同じ動作
        input.addEventListener('focus', function(e) {
            e.preventDefault();
            currentInput = this;
            openCardSelector();
        });

        // 直接の入力を防ぐ
        input.setAttribute('readonly', 'readonly');
    });
});

function openCardSelector() {
    document.getElementById('cardSelectorModal').style.display = 'flex';
    resetSelection();
}

function confirmSelection() {
    if (currentInput && currentSuit && currentRank) {
        const selectedCard = `${currentRank}${currentSuit.charAt(0).toUpperCase()}`;
        if (selectedCards.includes(selectedCard)) {
            alert('This card has already been selected. Please select another card.');
            return;
        }
        selectedCards.push(selectedCard);
        currentInput.value = selectedCard;
        closeModal();
    }
}


function closeModal() {
    document.getElementById('cardSelectorModal').style.display = 'none';
    currentInput = null;
}

// 既存の関数は同じまま
let currentSuit = '';
let currentRank = '';

function selectSuit(suit) {
    currentSuit = suit;
    document.querySelectorAll('.suit-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    updatePreview();
}

function selectRank(rank) {
    currentRank = rank;
    document.querySelectorAll('.rank-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    updatePreview();
}

function updatePreview() {
    const preview = document.getElementById('selectedCardPreview');
    if (currentSuit && currentRank) {
        preview.textContent = `${currentRank} of ${currentSuit}s`;
    } else {
        preview.textContent = 'None';
    }
}

function resetSelection() {
    currentSuit = '';
    currentRank = '';
    document.querySelectorAll('.suit-button, .rank-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    updatePreview();
}

// モーダルの外側をクリックした時に閉じる
document.getElementById('cardSelectorModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.querySelectorAll('.card-i').forEach(input => {
    input.addEventListener('input', function() {
        const card = this.value;
        if (selectedCards.includes(card)) {
            selectedCards = selectedCards.filter(c => c !== card);
        }
    });
});
