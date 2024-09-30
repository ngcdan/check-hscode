let dataTable;

function initializeDataTable() {

  dataTable = $('#dataTable').DataTable({
    responsive: true,
    columns: [
      { data: 'productName' }, // Tên hàng
      { data: 'hsCode' }, // HS Code
      {
        data: 'description', // Thông tin tham khảo
        render: function (data, type, row) {
          return data.replace(/\n/g, '<br>');
        }
      },
      {
        data: 'date',
        visible: false,
        type: 'date-eu' // Định dạng ngày kiểu Châu Âu (dd/MM/yyyy)
      }
    ],
    columnDefs: [
      {
        targets: '_all',
        render: function (data, type, row) {
          if (type === 'display') {
            const query = $('#searchInput').val();
            if (query) {
              const regex = new RegExp(`(${removeVietnameseTones(query)})`, 'gi');
              const dataWithoutTones = removeVietnameseTones(data);
              let result = data;
              let match;
              let offset = 0;

              while ((match = regex.exec(dataWithoutTones)) !== null) {
                const matchedText = data.slice(match.index + offset, regex.lastIndex + offset);
                const replacement = `<span class="bg-yellow-300 text-slate-800">${matchedText}</span>`;
                result = result.slice(0, match.index + offset) + replacement + result.slice(regex.lastIndex + offset);
                offset += replacement.length - matchedText.length;
              }
              return result;
            }
            return data;
          }
          return data;
        },
        className: "border-b border-slate-200 text-sm"
      }
    ],

    pageLength: 20,
    lengthMenu: [[10, 20, 50, 100, 200], [10, 20, 50, 100, 200]],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/vi.json'
    },
    processing: true,
    deferRender: true,
    scrollY: 400,
    dom: '<"flex justify-between items-center max-lg:flex-wrap"l<"ml-2 max-lg:ml-0"i>>rtip',
    pagingType: "simple_numbers",
    rowCallback: function (row, data, index) {
      $(row).addClass('hover:bg-slate-100 transition-colors duration-200 text-slate-700');
    },
    drawCallback: function (settings) {
      $('.dataTables_paginate')
        .addClass('mt-4 flex justify-center')
        .find('.paginate_button')
        .addClass('px-3 py-1 bg-white border border-slate-300 text-slate-500 hover:bg-slate-100')
        .filter('.current')
        .addClass('bg-blue-500 text-white hover:bg-blue-600')
        .removeClass('bg-white text-slate-500');

      $('.dataTables_info').addClass('text-sm text-slate-700');

      $('.dataTables_length select').addClass('ml-1 mr-1 py-1 px-2 border border-slate-300 rounded-md');
    },
    ordering: false // Disable automatic sorting
  });
}

async function searchData(query) {
  if (typeof gtag === 'function') {
    gtag('event', 'search', {
      'event_category': 'HS Code Search',
      'event_label': query,
      'value': 'User: Dan'
    });
  }

  $('#loading').show();
  dataTable.clear();
  const regex = new RegExp(`(${removeVietnameseTones(query)})`, 'gi');

  try {
    const response = await fetch('content/data.json');
    const data = await response.json();

    const filteredData = data.filter(item =>
      Object.values(item).some(value =>
        removeVietnameseTones(value.toString().toLowerCase()).includes(removeVietnameseTones(query.toLowerCase()))
      ))
      .map(item => {
        return {
          date: item.date,
          description: item.description.replace(/\n/g, '<br>').replace(regex, '<span class="bg-yellow-300 text-slate-800">$1</span>'),
          hsCode: item.hsCode.replace(regex, '<span class="bg-yellow-300 text-slate-800">$1</span>'),
          productName: item.productName.replace(regex, '<span class="bg-yellow-300 text-slate-800">$1</span>')
        };
      })
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateB.localeCompare(dateA);
      });

    dataTable.rows.add(filteredData).draw();
  } catch (error) {
    console.error('Error loading or processing data.json:', error);
  }

  $('#loading').hide();
}

$(document).ready(function () {
  initializeDataTable();

  $('#searchButton').on('click', function () {
    const query = $('#searchInput').val();
    if (query) {
      searchData(query);
    }
  });

  $('#searchInput').on('keypress', function (e) {
    if (e.which === 13) {
      $('#searchButton').click();
    }
  });
});

function removeVietnameseTones(str) {
  // Replace Vietnamese characters with their non-accented counterparts
  str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  str = str.replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, "A");
  str = str.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  str = str.replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, "E");
  str = str.replace(/[ìíịỉĩ]/g, "i");
  str = str.replace(/[ÌÍỊỈĨ]/g, "I");
  str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  str = str.replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, "O");
  str = str.replace(/[ùúụủũưừứựửữ]/g, "u");
  str = str.replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, "U");
  str = str.replace(/[ỳýỵỷỹ]/g, "y");
  str = str.replace(/[ỲÝỴỶỸ]/g, "Y");
  str = str.replace(/[đ]/g, "d");
  str = str.replace(/[Đ]/g, "D");

  // Remove combining diacritical marks
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Remove extra spaces
  str = str.replace(/\s+/g, " ").trim();

  // Remove punctuation and special characters
  str = str.replace(/[!@%^*()+=<>?/,.:;'"&#[\]~$_`\-{}|\\]/g, " ");

  return str;
}
