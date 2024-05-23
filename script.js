document.addEventListener('DOMContentLoaded', () => {
    const { jsPDF } = window.jspdf;
    const today = new Date().toISOString().substring(0, 10);
    document.getElementById('invoiceDate').value = today;

    document.getElementById('downloadPdfButton').addEventListener('click', () => {
        html2canvas(document.body).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('invoice.pdf');
        });
    });

    function updateInvoice() {
        let grandTotal = 0;
        document.querySelectorAll('table.inventory tbody tr').forEach(row => {
            const quantity = parseInt(row.cells[2].querySelector('span').textContent.trim()) || 0;
            const priceText = row.cells[3].querySelector('span[contenteditable]').textContent.trim();
            const price = parseFloat(priceText.replace(/[^\d.-]/g, '')) || 0;
            const total = quantity * price;
            grandTotal += total;
        });

        const totalCell = document.querySelector('table.balance tr:first-child td:last-child span');
        totalCell.textContent = `$${grandTotal.toFixed(2)}`;

        updateBalanceDue(grandTotal);
    }

    function updateBalanceDue(grandTotal) {
        const amountPaidSpan = document.getElementById('amountPaid');
        const amountPaid = parseFloat(amountPaidSpan.textContent.replace(/[^\d.-]/g, '')) || 0;
        const balanceDue = grandTotal - amountPaid;
        const balanceDueCell = document.querySelector('table.balance tr:nth-child(3) td:last-child span');
        balanceDueCell.textContent = `$${balanceDue.toFixed(2)}`;
    }

    function addEventListenersToRow(row) {
        row.querySelectorAll('span[contenteditable]').forEach(span => {
            span.addEventListener('input', updateInvoice);
        });

        const removeButton = row.querySelector('a.cut');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                row.remove();
                updateInvoice(); // Update the invoice after removing a row
            });
        }
    }

    function addNewRow() {
        const tbody = document.querySelector('table.inventory tbody');
        const newRow = generateTableRow();
        tbody.appendChild(newRow);
        addEventListenersToRow(newRow);
    }

    document.querySelector('.add').addEventListener('click', addNewRow);

    document.querySelectorAll('table.inventory tbody tr').forEach(row => {
        addEventListenersToRow(row);
    });

    // Update balance due only when the amount paid is manually changed
    const amountPaidSpan = document.getElementById('amountPaid');
    amountPaidSpan.addEventListener('input', () => {
        updateBalanceDue(parseFloat(document.querySelector('table.balance tr:first-child td:last-child span').textContent.replace(/[^\d.-]/g, '')));
    });

    // Initial call to updateInvoice to ensure any pre-existing data is calculated
    updateInvoice();
});

function generateTableRow() {
    const emptyColumn = document.createElement('tr');
    emptyColumn.innerHTML = `
        <td><a class="cut">-</a><span contenteditable></span></td>
        <td><span contenteditable></span></td>
        <td><span contenteditable>1</span></td>
        <td><span data-prefix="$"></span><span contenteditable>0.00</span></td>
    `;
    return emptyColumn;
}
