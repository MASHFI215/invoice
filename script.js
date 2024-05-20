(function (document) {
    var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement,
        elements = 'article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output picture progress section summary time video x'.split(' '),
        elementsLength = elements.length,
        elementsIndex = 0,
        element;

    while (elementsIndex < elementsLength) {
        element = document.createElement(elements[++elementsIndex]);
    }

    element.innerHTML = 'x<style>' +
        'article,aside,details,figcaption,figure,footer,header,hgroup,nav,section{display:block}' +
        'audio[controls],canvas,video{display:inline-block}' +
        '[hidden],audio{display:none}' +
        'mark{background:#FF0;color:#000}' +
        '</style>';

    return head.insertBefore(element.lastChild, head.firstChild);
})(document);

// Polyfill for matchesSelector and ancestorQuerySelector
(function (window, ElementPrototype, ArrayPrototype, polyfill) {
    function NodeList() { [polyfill] }
    NodeList.prototype.length = ArrayPrototype.length;

    ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
        ElementPrototype.mozMatchesSelector ||
        ElementPrototype.msMatchesSelector ||
        ElementPrototype.oMatchesSelector ||
        ElementPrototype.webkitMatchesSelector ||
        function matchesSelector(selector) {
            return ArrayPrototype.indexOf.call(this.parentNode.querySelectorAll(selector), this) > -1;
        };

    ElementPrototype.ancestorQuerySelectorAll = ElementPrototype.ancestorQuerySelectorAll ||
        ElementPrototype.mozAncestorQuerySelectorAll ||
        ElementPrototype.msAncestorQuerySelectorAll ||
        ElementPrototype.oAncestorQuerySelectorAll ||
        ElementPrototype.webkitAncestorQuerySelectorAll ||
        function ancestorQuerySelectorAll(selector) {
            for (var cite = this, newNodeList = new NodeList; cite = this.parentElement;) {
                if (cite.matchesSelector(selector)) ArrayPrototype.push.call(newNodeList, cite);
            }

            return newNodeList;
        };

    ElementPrototype.ancestorQuerySelector = ElementPrototype.ancestorQuerySelector ||
        ElementPrototype.mozAncestorQuerySelector ||
        ElementPrototype.msAncestorQuerySelector ||
        ElementPrototype.oAncestorQuerySelector ||
        ElementPrototype.webkitAncestorQuerySelector ||
        function ancestorQuerySelector(selector) {
            return this.ancestorQuerySelectorAll(selector)[0] || null;
        };
})(this, Element.prototype, Array.prototype);

// Function to generate a new table row
function generateTableRow() {
    var emptyColumn = document.createElement('tr');

    emptyColumn.innerHTML = '<td><a class="cut">-</a><span contenteditable></span></td>' +
        '<td><span contenteditable></span></td>' +
        '<td><span contenteditable>1</span></td>' +
        '<td><span data-prefix>$</span><span contenteditable>0.00</span></td>';

    return emptyColumn;
}

// Function to parse float from HTML content
function parseFloatHTML(element) {
    return parseFloat(element.innerHTML.replace(/[^\d\.\-]+/g, '')) || 0;
}

// Function to format a number as price
function parsePrice(number) {
    return number.toFixed(2).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1,');
}

// Function to update number values on user interaction
function updateNumber(e) {
    var activeElement = document.activeElement,
        value = parseFloat(activeElement.innerHTML),
        wasPrice = activeElement.innerHTML == parsePrice(parseFloatHTML(activeElement));

    if (!isNaN(value) && (e.keyCode == 38 || e.keyCode == 40 || e.wheelDeltaY)) {
        e.preventDefault();

        value += e.keyCode == 38 ? 1 : e.keyCode == 40 ? -1 : Math.round(e.wheelDelta * 0.025);
        value = Math.max(value, 0);

        activeElement.innerHTML = wasPrice ? parsePrice(value) : value;
    }

    updateInvoice();
}

// Function to update invoice totals
function updateInvoice() {
    var total = 0;
    var cells, price, a, i;

    for (a = document.querySelectorAll('table.inventory tbody tr'), i = 0; a[i]; ++i) {
        cells = a[i].querySelectorAll('span:last-child');
        price = parseFloatHTML(cells[2]) * parseFloatHTML(cells[3]);
        total += price;
        cells[3].innerHTML = parsePrice(price);
    }

    cells = document.querySelectorAll('table.balance td:last-child span:last-child');
    cells[0].innerHTML = total;
    cells[2].innerHTML = parsePrice(total - parseFloatHTML(cells[1]));

    var prefix = document.querySelector('#prefix');
    if (prefix) {
        for (a = document.querySelectorAll('[data-prefix] + span'), i = 0; a[i]; ++i) {
            if (document.activeElement != a[i]) {
                a[i].innerHTML = parsePrice(parseFloatHTML(a[i]));
            }
        }
    }
}

// Initialize event listeners
function onContentLoad() {
    updateInvoice();

    var input = document.querySelector('input');
    var image = document.querySelector('img');
    var imageContainer = document.querySelector('.logo-container');
    var removeRowButtons = document.querySelectorAll('.cut');
    var addRowButton = document.querySelector('.add');

    if (input && image) {
        input.addEventListener('focus', function () {
            input.className = 'focus';
        });

        input.addEventListener('blur', function () {
            input.className = '';
        });

        input.addEventListener('change', function () {
            image.src = URL.createObjectURL(input.files[0]);
            imageContainer.style.display = 'flex';
        });
    }

    if (removeRowButtons.length > 0) {
        for (var i = 0; i < removeRowButtons.length; i++) {
            removeRowButtons[i].addEventListener('click', function (event) {
                var row = event.target.closest('tr');
                row.parentNode.removeChild(row);
                updateInvoice();
            });
        }
    }

    if (addRowButton) {
        addRowButton.addEventListener('click', function () {
            document.querySelector('table.inventory tbody').appendChild(generateTableRow());
            updateInvoice(); // Ensure the new row is accounted for in the invoice
        });
    }

    var inventoryTable = document.querySelector('table.inventory tbody');
    inventoryTable.addEventListener('input', updateInvoice);

    document.addEventListener('input', updateInvoice);

    document.addEventListener('mousewheel', updateNumber);
    document.addEventListener('keydown', updateNumber);
}

window.addEventListener('DOMContentLoaded', onContentLoad);
