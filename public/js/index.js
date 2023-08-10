const product_div = `
<li class="product-item col-lg-3 col-md-4 col-sm-6 mb-4">
    <div class="product-item-div">
        <div class="product-image mt-2"><img src="" alt="termek-neve"></div>
        <div class="product-details">
            <h3 class="product-title"></h3>
            <div class="product-price-wrapper container">
                <span class="lowest-price"></span>
                <div class="shopping-list-btn">
                    <button type="button" class="btn favorites-icon" onclick=""><i class="bi bi-heart"></i></button>
                    <button type="button" style="width: 70%;" class="btn btn-primary mb-2 add-to-cart">Hozzáad</button>
                </div>
            </div>
        </div>
    </div>
</li>`;

const priceBoxDiv = `<div class="product-price row">
        <div class="col-3"><img src="" alt=""></div>
        <div class="col-7 price"></div></div>`

// Sütik
let favoritesArray = [];
let cartArray = []

// Termékek betöltése
let products = [];
let markets = [];
let productsToShow = [];
let loadInProgress = false;


$(window).on('scroll', function(){
    if ($(window).scrollTop() + $(window).height() + 5 >= $(document).height()) {
        loadMoreProducts();
    }
});

function toggleHeartIcon(button, id) {
    const heartIcon = $(button).find('.bi');
    if (heartIcon.hasClass('bi-heart-fill')) removeFromFavorites(id);
    else addToFavorites(id);
    heartIcon.toggleClass('bi-heart');
    heartIcon.toggleClass('bi-heart-fill');
}



// Sütik kezelése
function loadCookies(){
    favoritesArray = document.cookie.split("; ").find((row) => row.startsWith("favorites="))?.split("=")[1] || [];
    if(favoritesArray.length != 0) { favoritesArray = JSON.parse(favoritesArray)}
    cartArray = document.cookie.split("; ").find((row) => row.startsWith("shoppingCart="))?.split("=")[1] || [];
    if(cartArray.length != 0) { cartArray = JSON.parse(cartArray)}
}

loadCookies()

function addToFavorites(id) {
    favoritesArray = document.cookie.split("; ").find((row) => row.startsWith("favorites="))?.split("=")[1] || [];
    if(favoritesArray.length != 0) { favoritesArray = JSON.parse(favoritesArray)}

    if (!favoritesArray.includes(id)) {
        favoritesArray.push(id);
        document.cookie = `favorites=${JSON.stringify(favoritesArray)}; expires=${new Date(new Date().getTime() + 30 * 24 * 3600000).toUTCString()}; path=/`;    }
}

function removeFromFavorites(id) {
    favoritesArray = document.cookie.split("; ").find((row) => row.startsWith("favorites="))?.split("=")[1] || [];
    if(favoritesArray.length != 0) { favoritesArray = JSON.parse(favoritesArray)}

    const index = favoritesArray.indexOf(id);
    if (index !== -1) favoritesArray.splice(index, 1);
    document.cookie = `favorites=${JSON.stringify(favoritesArray)}; expires=${new Date(new Date().getTime() + 30 * 24 * 3600000).toUTCString()}; path=/`;
}

function addToCart(id) {
    cartArray = document.cookie.split("; ").find((row) => row.startsWith("shoppingCart="))?.split("=")[1] || [];
    if(cartArray.length != 0) { cartArray = JSON.parse(cartArray)}

    if (!cartArray.includes(id)) {
        cartArray.push(id);
        console.log(cartArray)
        document.cookie = `shoppingCart=${JSON.stringify(cartArray)}; expires=${new Date(new Date().getTime() + 30 * 24 * 3600000).toUTCString()}; path=/`;    }
}

function removeFromCart(id) {
    cartArray = document.cookie.split("; ").find((row) => row.startsWith("shoppingCart="))?.split("=")[1] || [];
    if(cartArray.length != 0) { cartArray = JSON.parse(cartArray)}

    const index = cartArray.indexOf(id);
    if (index !== -1) cartArray.splice(index, 1);
    document.cookie = `shoppingCart=${JSON.stringify(cartArray)}; expires=${new Date(new Date().getTime() + 30 * 24 * 3600000).toUTCString()}; path=/`;
}




async function fetchAllProducts() {
    const response = await fetch(`/getproducts/${markets}`);
    products = await response.json();
    return products;
}

// Forintra alakít egy intet
function intToHuf(amount) {
    const formattedAmount = amount.toLocaleString('hu-HU');
    return `${amount.toLocaleString('hu-HU')} Ft`;
}

// Paraméterként kapott terméket hozzáadja a products-hoz
function addProduct(product){
    const liElement = $(product_div);
    liElement.find('.product-image img').attr('src', product.img);
    liElement.find('.product-image img').attr('alt', product.name);
    var index = favoritesArray.indexOf(product.id);
    if (index !== -1) {
        liElement.find(".bi").toggleClass('bi-heart');
        liElement.find(".bi").toggleClass('bi-heart-fill');
    }
    liElement.find(".favorites-icon").attr("onclick", `toggleHeartIcon(this, ${product.id});`);
    liElement.find(".add-to-cart").attr("onclick", `addToCart(${product.id});`);
    liElement.find('.product-title').text(product.name);
    if(product.best_price) liElement.find('.lowest-price').text(`Legalacsonyabb ár*: ${intToHuf(product.best_price)}`);
    markets.forEach(market => {
        if(product[`${market}_price`]){
            const priceBox = $(priceBoxDiv);
            priceBox.find("div img").attr("src", `svg/${market}.svg`);
            priceBox.find(".price").prepend(intToHuf(product[`${market}_price`]));
            liElement.find('.product-price-wrapper').prepend(priceBox);
        }
    });
    $('#products').append(liElement);
}

function loadProduct(index, product20) {
    if (index < product20.length) {
        return new Promise(resolve => {
            setTimeout(() => {
                addProduct(product20[index]);
                resolve();
            }, 20); 
        }).then(() => loadProduct(index + 1, product20));
    } else {
        loadInProgress = false;
    }
}

function loadMoreProducts() {
    loadInProgress = true;
    const productToLoad = productsToShow.slice(0, Math.min(20, productsToShow.length));
    productsToShow = productsToShow.slice(productToLoad.length);
    loadProduct(0, productToLoad);
}

async function main(){
    if(loadInProgress) return;
    $('#waitWidget').css("display", "block")
    if (products.length == 0) await fetchAllProducts();
    $('#category-title').text("Kedvezményes termékek")
    $('#products').empty()
    productsToShow = products.filter(product => {
        return product.tesco_price <= product.best_price || 
        product.auchan_price <= product.best_price || 
        product.spar_price <= product.best_price || 
        product.aldi <= product.best_price || 
        product.penny_price <= product.best_price;});
    loadMoreProducts(productsToShow);
    $('#waitWidget').css("display", "none")    
}

function loadByCategory(category, categoryTitle) {
    if(loadInProgress) return;
    $('#category-title').text(categoryTitle)
    $('#products').empty()

    productsToShow = products.filter(product => product.category === category);
    loadMoreProducts(productsToShow);
}

function containString(name, productName){
    name = name.toLowerCase().normalize("NFD").replace(/[^a-zA-Z]/g, '');
    productName = productName.toLowerCase().normalize("NFD").replace(/[^a-zA-Z]/g, '');
    if(productName.includes(name)) return true;
    else return false;
}

function loadByName(name) {
    if(loadInProgress) return;
    loadInProgress = true;
    $('#category-title').text(`Keresés erre: ${name}`);
    $('#products').empty();
    productsToShow = products.filter(product => product.category === category);
    loadMoreProducts(productsToShow);
}

$('#searchForm').submit(function(event) {
    event.preventDefault();
    var searchText = $('#searchInput').val();
    loadByName(searchText);
});

function submitForm(event,form) {
    event.preventDefault();
    markets = $(form).find("input[name='stores']:checked").map(function() {
        return this.value;
    }).get();
    if(markets.length != 0){
        main()
        $("#myModal").css("display", "none")
    } else {
        alert("Legalább egy üzletet ki kell választanod!")
    }
}







