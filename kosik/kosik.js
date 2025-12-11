import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Firebase konfigurace
const firebaseConfig = {
    apiKey: "AIzaSyAbKrnMdiJ0dElO00V37qcrxp8zEg65csI",
    authDomain: "sigmapumpykosik.firebaseapp.com",
    projectId: "sigmapumpykosik",
    storageBucket: "sigmapumpykosik.firebasestorage.app",
    messagingSenderId: "250138471588",
    appId: "1:250138471588:web:81dd8aadf011990ee50a31",
    measurementId: "G-CSWR4DMBXF"
};

// Inicializace Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Načtení košíku z localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Uložení košíku do localStorage
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    upadteCartCountMobile();
}

// Přidání do košíku
window.addToCart = function(item) {
    let existingItem = cart.find(cartItem => cartItem.name === item.name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1,
            imageUrl: item.imageUrl || "img/12oz Can-2.png"
        });
    }
    saveCart();
    renderCartIfExists();
};

// Odebrání z košíku
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartIfExists();
};

// Aktualizace množství
window.updateQuantity = function(index, action) {
    if (cart[index]) {
        if (action === 'increase') {
            cart[index].quantity = (cart[index].quantity || 0) + 1;
        } else if (action === 'decrease' && cart[index].quantity > 1) {
            cart[index].quantity--;
        }
        saveCart();
        renderCartIfExists();
    }
};

// Zobrazení košíku (pokud je na stránce prvek s id 'cart')
function renderCart() {
    const cartList = document.getElementById("cart");
    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = "<li>Košík je prázdný</li>";
    } else {
        cartList.innerHTML = "";
        cart.forEach((item, index) => {
            const quantity = item.quantity || 1;
            const li = document.createElement("li");
            li.classList.add("cart-item");

            li.innerHTML = `
                <img src="${item.imageUrl || "img/default.jpg"}" alt="${item.name}" class="cart-item-image" onerror="this.src='img/placeholder.jpg'">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-quantity">
                        <button onclick="updateQuantity(${index}, 'decrease')">-</button>
                        ${quantity} ks
                        <button onclick="updateQuantity(${index}, 'increase')">+</button>
                    </span>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">Odebrat</button>
                </div>
            `;
            cartList.appendChild(li);
        });
    }
}

// Bezpečné zavolání renderCart jen pokud element existuje
function renderCartIfExists() {
    if (document.getElementById("cart")) {
        renderCart();
    }
}

// Custom alert (modal)
function showCustomAlert(message, redirectTo) {
    const existingModal = document.querySelector(".custom-alert");
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.classList.add("custom-alert");

    modal.innerHTML = `
        <div class="custom-alert-content">
            <p>${message}</p>
            <button id="okButton">OK</button>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("okButton").onclick = function() {
        modal.remove();
        if (redirectTo) {
            window.location.href = redirectTo;
        }
    };
}

// Odeslání objednávky do Firestore
window.submitOrder = async function() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const address = document.getElementById("address").value;

    if (!name || !email || !address || cart.length === 0) {
        showCustomAlert("Vyplňte všechna pole nebo přidejte položky do košíku.");
        return;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethod) {
        showCustomAlert("Vyberte platební metodu.");
        return;
    }

    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    if (!deliveryMethod) {
        showCustomAlert("Vyberte metodu doručení.");
        return;
    }

    try {
        await addDoc(collection(db, "orders"), {
            name,
            email,
            address,
            items: cart,
            paymentMethod: paymentMethod.value,
            deliveryMethod: deliveryMethod.value,
            timestamp: new Date()
        });

        cart = [];
        saveCart();

        showCustomAlert("Objednávka byla úspěšně odeslána!", "index.html");
    } catch (error) {
        console.error("Error adding document: ", error);
        showCustomAlert("Chyba při odesílání objednávky. Zkuste to prosím znovu.");
    }
};

// Aktualizace počtu položek v košíku (všude)
function updateCartCount() {
    const countElem = document.getElementById("cart-count");
    if (!countElem) return;

    let totalItems = 0;
    cart.forEach(item => {
        totalItems += item.quantity || 0;
    });

    countElem.textContent = totalItems;

    if (totalItems > 0) {
        countElem.style.display = 'inline-block';
    } else {
        countElem.style.display = 'none';
    }
}

function upadteCartCountMobile () {
    const countElem = document.getElementById("cart-count-mobile");
    if (!countElem) return;

    let totalItems = 0;
    cart.forEach(item => {
        totalItems += item.quantity || 0;
    });

    countElem.textContent = totalItems;

    if (totalItems > 0) {
        countElem.style.display = 'inline-block';
    } else {
        countElem.style.display = 'none';
    }
}

// Poslech změn localStorage z jiných záložek
window.addEventListener('storage', (event) => {
    if (event.key === 'cart') {
        cart = JSON.parse(event.newValue) || [];
        renderCartIfExists();
        updateCartCount();
        upadteCartCountMobile();
    }
});

// Inicializace při načtení stránky
window.addEventListener('DOMContentLoaded', () => {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    renderCartIfExists();
    updateCartCount();
    upadteCartCountMobile();
});
