const Handlebars = require('handlebars');
const { readFileSync } = require('fs');
const Mailgun = require('#email');
const logger = require('#services/logger');

const emailContent = Handlebars.compile(
  readFileSync(`${__dirname}/templates/dailyReport.html`).toString(),
);
// const loginURL = `${process.env.FRONTEND_URL}/login`;

const { MAILGUN_ENABLED, MAILGUN_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;

const weekday = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const month = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const dayFormat = day => {
  switch (day) {
    case 1:
    case 21:
    case 31:
      return day + 'st';
    case 2:
    case 22:
      return day + 'nd';
    case 3:
    case 23:
      return day + 'rd';
    default:
      return day + 'th';
  }
};

module.exports = async function sendDailyReportEmail(user, ctx) {
  // date
  let date = new Date();
  let year = date.getFullYear();
  let m = date.getMonth();
  let day = date.getDate();
  let dayWeek = date.getDay();
  let previousDay = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  let pyear = previousDay.getFullYear();
  let pm = previousDay.getMonth();
  let pday = previousDay.getDate();
  let pdayWeek = previousDay.getDay();
  let title = weekday[dayWeek] + ' ' + month[m] + '  ' + dayFormat(day) + ' ' + year;
  //Today's Goal
  const table1 = {
    headers: ['Store', 'Goals', 'Last Year', 'Traffic LY'],
    data: [
      { data1: 'Delta Park', data2: '$10,222', data3: '$4,959', data4: '13' },
      { data1: 'Tualatin', data2: '$10,016', data3: '$18,297', data4: '22' },
      { data1: 'Clackamas', data2: '$10,299', data3: '$14,661', data4: '19' },
      { data1: 'Tanasbourne', data2: '$9,291', data3: '$13,077', data4: '19' },
      { data1: 'Salem', data2: '$8,483', data3: '$3,429', data4: '13' },
      { data1: 'Eugene', data2: '$8,243', data3: '$8,315', data4: '20' },
      { data1: 'Area 95', data2: '$0', data3: '$0', data4: '-' },
      { data1: 'Other', data2: '$644', data3: '$68', data4: '-' },
    ],
    total: ['Total', '$57,198', '$62,806', '106'],
  };
  //Yesterday's Result
  const table2 = {
    headers: [
      'Store',
      'Goals',
      'Actual',
      '% of Goal',
      'Last Year',
      '% of LY',
      'Traffic LY',
      'Traffic TY',
      '% to LY',
    ],
    data: [
      {
        data1: 'Delta Park',
        data2: '$9,200',
        data3: '$188',
        data4: '102.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Tualatin',
        data2: '$9,015',
        data3: '$10,561',
        data4: '117.1%',
        data5: '$4,636',
        data6: '227.8%',
        data7: '10',
        data8: '12',
        data9: '140%',
      },
      {
        data1: 'Clackamas',
        data2: '$9,269',
        data3: '$10,329',
        data4: '11.4%',
        data5: '$2,811',
        data6: '367.4%',
        data7: '19',
        data8: '10',
        data9: '52.6%',
      },
      {
        data1: 'Tanasbourne',
        data2: '$9,291',
        data3: '$13,077',
        data4: '112.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Salem',
        data2: '$8,483',
        data3: '$3,429',
        data4: '170.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Eugene',
        data2: '$8,243',
        data3: '$8,315',
        data4: '200.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Area 95',
        data2: '$0',
        data3: '$0',
        data4: '123.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Other',
        data2: '$644',
        data3: '$68',
        data4: '157.8.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
    ],
    total: [
      'Total',
      '$274,545',
      '$152,471',
      '155.5%',
      '323.659',
      '47.1%',
      '385',
      '262',
      '68.1%',
    ],
  };
  //Week to date results
  const table3 = {
    headers: [
      'Store',
      'Goals',
      'Actual',
      '% of Goal',
      'Last Year',
      '% of LY',
      'Traffic LY',
      'Traffic TY',
      '% to LY',
    ],
    title: 'Week to date results',
    subtitle: '05/28/2023 - 06/1/2023',
    data: [
      {
        data1: 'Delta Park',
        data2: '$9,200',
        data3: '$188',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Tualatin',
        data2: '$9,015',
        data3: '$10,561',
        data4: '117.1%',
        data5: '$4,636',
        data6: '227.8%',
        data7: '10',
        data8: '12',
        data9: '140%',
      },
      {
        data1: 'Clackamas',
        data2: '$9,269',
        data3: '$10,329',
        data4: '11.4%',
        data5: '$2,811',
        data6: '367.4%',
        data7: '19',
        data8: '10',
        data9: '52.6%',
      },
      {
        data1: 'Tanasbourne',
        data2: '$9,291',
        data3: '$13,077',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Salem',
        data2: '$8,483',
        data3: '$3,429',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Eugene',
        data2: '$8,243',
        data3: '$8,315',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Area 95',
        data2: '$0',
        data3: '$0',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Other',
        data2: '$644',
        data3: '$68',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
    ],
    total: [
      'Total',
      '$274,545',
      '$152,471',
      '55.5%',
      '323.659',
      '47.1%',
      '385',
      '262',
      '68.1%',
    ],
  };
  //Month to date results
  const table4 = {
    title: 'Month to date results',
    subtitle: m + 1 + '/01/2023 - ' + (m + 1) + '/' + day + '/' + year,
    headers: [
      'Store',
      'Goals',
      'Actual',
      '% of Goal',
      'Last Year',
      '% of LY',
      'Traffic LY',
      'Traffic TY',
      '% to LY',
    ],
    data: [
      {
        data1: 'Delta Park',
        data2: '$9,200',
        data3: '$188',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Tualatin',
        data2: '$9,015',
        data3: '$10,561',
        data4: '117.1%',
        data5: '$4,636',
        data6: '227.8%',
        data7: '10',
        data8: '12',
        data9: '140%',
      },
      {
        data1: 'Clackamas',
        data2: '$9,269',
        data3: '$10,329',
        data4: '11.4%',
        data5: '$2,811',
        data6: '367.4%',
        data7: '19',
        data8: '10',
        data9: '52.6%',
      },
      {
        data1: 'Tanasbourne',
        data2: '$9,291',
        data3: '$13,077',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Salem',
        data2: '$8,483',
        data3: '$3,429',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Eugene',
        data2: '$8,243',
        data3: '$8,315',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Area 95',
        data2: '$0',
        data3: '$0',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Other',
        data2: '$644',
        data3: '$68',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
    ],
    total: [
      'Total',
      '$274,545',
      '$152,471',
      '55.5%',
      '323.659',
      '47.1%',
      '385',
      '262',
      '68.1%',
    ],
  };
  //Year to date results
  const table5 = {
    title: 'Year to date results',
    subtitle: '01/01/2023 - ' + (m + 1) + '/' + day + '/' + year,
    headers: [
      'Store',
      'Goals',
      'Actual',
      '% of Goal',
      'Last Year',
      '% of LY',
      'Traffic LY',
      'Traffic TY',
      '% to LY',
    ],
    data: [
      {
        data1: 'Delta Park',
        data2: '$9,200',
        data3: '$188',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Tualatin',
        data2: '$9,015',
        data3: '$10,561',
        data4: '117.1%',
        data5: '$4,636',
        data6: '227.8%',
        data7: '10',
        data8: '12',
        data9: '140%',
      },
      {
        data1: 'Clackamas',
        data2: '$9,269',
        data3: '$10,329',
        data4: '11.4%',
        data5: '$2,811',
        data6: '367.4%',
        data7: '19',
        data8: '10',
        data9: '52.6%',
      },
      {
        data1: 'Tanasbourne',
        data2: '$9,291',
        data3: '$13,077',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Salem',
        data2: '$8,483',
        data3: '$3,429',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Eugene',
        data2: '$8,243',
        data3: '$8,315',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Area 95',
        data2: '$0',
        data3: '$0',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
      {
        data1: 'Other',
        data2: '$644',
        data3: '$68',
        data4: '2.0%',
        data5: '$21,453',
        data6: '.9%',
        data7: '12',
        data8: '9',
        data9: '75%',
      },
    ],
    total: [
      'Total',
      '$274,545',
      '$152,471',
      '55.5%',
      '323.659',
      '47.1%',
      '385',
      '262',
      '68.1%',
    ],
  };

  if (MAILGUN_ENABLED === 'true' && MAILGUN_API_KEY) {
    const response = await Mailgun.sendMessage({
      from: `${MAIL_FROM_NAME} ${MAIL_FROM_EMAIL}`,
      to: `${user.full_name} ${user.email}`,
      subject: title,
      html: emailContent({
        today: weekday[dayWeek] + ' ' + month[m] + '  ' + dayFormat(day) + ' ' + year,
        yesterday:
          weekday[pdayWeek] + ' ' + month[pm] + '  ' + dayFormat(pday) + ' ' + pyear,
        loginURL: '#',
        title: title,
        table1: table1,
        table2: table2,
        table3: table3,
        table4: table4,
        table5: table5,
      }),
    });
    logger.debug(response);
    return response;
  } else {
    logger.debug('🚫 No email API defined');
    return 'not sent';
  }
};
