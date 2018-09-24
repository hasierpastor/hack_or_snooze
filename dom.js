//TODO
//don't have favorites be a filter
//show regular stories when you click "Hack or Snooze" home
//how do you log out? (right now--> manually clear local storage?)

//currentUser is updated in 3 cases:
// 1. user clicks login
// 2. user clicks signup (which calls login)
// 3. page is refreshed while a user is logged in
let currentUser;

//currentStoryList is updated whenever the page is refreshed.
//equal to the storyList retrieved from the API by calling StoryList.getstories()
//If a user is logged in and any of the stories displayed are in the user's favorites, these should already be marked as "favorite"
let currentStoryList;

$(document).ready(function() {
  if (localStorage.getItem('token')) {
    let decryptedToken = JSON.parse(
      atob(localStorage.getItem('token').split('.')[1])
    );
    currentUser = new User(decryptedToken.username);
    currentUser.loginToken = localStorage.getItem('token');
    currentUser.retrieveDetails(resp => displayStoryList());
    $('#login-form').addClass('hidden-item');
    $('#view-profile').removeClass('hidden-item');
  } else {
    displayStoryList();
  }

  //these event listeners should be on the page whether a user is logged in or not
  $('#view-profile').on('click', () => {
    $('#profile-name').text(`${currentUser.name}`);
    $('#profile-username').text(`${currentUser.username}`);
  });

  $('#edit-profile').on('click', () => {
    $('#edit-profile-form').removeClass('hidden-item');
    $('#save-profile').removeClass('hidden-item');
    $('#edit-profile').addClass('hidden-item');
    $('#profile-div').addClass('hidden-item');
    $('#edit-name').attr('placeholder', `${currentUser.name}`);
    $('#edit-current-password').attr(
      'placeholder',
      `Please enter your current password`
    );
    $('#edit-new-password').attr('placeholder', `Please enter new password`);
  });

  $('#save-profile').on('click', () => {
    let name = currentUser.name;
    let password = $('#edit-password').val();
    if ($('#edit-name').val()) {
      name = $('#edit-name').val();
    }
    let dataObject = {
      name,
      password
    };
    currentUser.update(dataObject, resp => {
      currentUser.retrieveDetails(() => {});
    });
  });

  $('#signup').on('click', () => {
    $('#signup-form').slideToggle();
  });
  $('#submit-signup-button').on('click', signUp);
  $('#login-form').on('submit', login);

  $('#favorites').on('click', () => {
    if (currentUser) {
      populateFavorites();
    } else {
      alert('Please log in to view your favorite stories.');
    }
  });

  $('#my-stories').on('click', () => {
    if (currentUser) {
      populateMyStories();
    } else {
      alert('Please login to view your stories.');
    }
    $('#story-list').on('click', '.fa-trash-alt', () => {
      currentStoryList.removeStory(currentUser, event.target.id, () => {
        populateMyStories();
      });
    });
  });

  $('#home-button').on('click', () => {
    $('#story-list').empty();
    populateRegularList();
  });
});

function getHostname(url) {
  url = url.replace('https://', '');
  url = url.replace('http://', '');
  url = url.replace('www.', '');
  return url.split('/')[0];
}

function displayStoryList() {
  if (currentUser) {
    populateRegularList();
    enableFavorites();
    enableSubmitStory();
    //NEED to REMOVE: can't log in if already logged in --> $('#login-form').on('submit', login);
  } else {
    populateRegularList();
  }
}

function signUp() {
  event.preventDefault();
  let username = $('#username-input').val();
  let password = $('#password-input').val();
  let name = $('#name-input').val();
  User.create(username, password, name, newUser => {
    currentUser = newUser;
    currentUser.login(resp => {
      localStorage.setItem('token', currentUser.loginToken);
      // localStorage.setItem('currentUser', currentUser);
      currentUser.retrieveDetails(resp => console.log(resp));
    });
  });
  $('#signup-form').trigger('reset');
  $('#signup-form').slideToggle();
}
function login() {
  let username = $('#username').val();
  let password = $('#password').val();
  currentUser = new User(username, password);
  currentUser.login(resp => {
    localStorage.setItem('token', currentUser.loginToken);
    // localStorage.setItem('currentUser', currentUser);
    currentUser.retrieveDetails(resp => {
      $('#story-list').empty();
      displayStoryList();
    });
    enableFavorites();
    enableSubmitStory();
    $('#login-form').trigger('reset');
  });
  $('#login-form').addClass('hidden-item');
  $('#view-profile').removeClass('hidden-item');
}
function createStory() {
  event.preventDefault();
  let title = $('#title').val();
  let url = $('#url').val();
  //let username = currentUser.username;
  let author = getHostname(url);
  let dataObject = {
    title,
    url,
    author
  };
  currentStoryList.addStory(currentUser, dataObject, resp => {
    console.log(resp);
  });
  $('#submit-form').trigger('reset');
  $('#submit-form').slideToggle();
}

//called if a user is logged in
//sets event listeners on the star icons --> users can click to add/remove story from favorites
//TODO: favorites are stored in user details in API and SHOULD repopulate when user logs in
//it DOES show already favorited stories on refresh, but not right after user logs in
//second refresh clears the stars
function enableFavorites() {
  $('ol').on('click', '.fa-star', function(event) {
    $(event.target).toggleClass('far fas');
    $(event.target)
      .parent()
      .toggleClass('favorites');
  });
  $('ol').on('click', '.far.fa-star', addFavorite);
  $('ol').on('click', '.fas.fa-star', removeFavorite);
}

//called if a user is logged in, shows submit form
//only users who are logged in should be able to submit a story (does nothing if not logged in)
function enableSubmitStory() {
  $('#submit-dropdown').on('click', () => {
    $('#submit-form').slideToggle();
  });
  $('#submit-form').on('submit', createStory);
}

function addFavorite(event) {
  let storyId = event.target.id;
  currentUser.addFavorite(storyId, resp => {
    console.log(resp);
  });
}
function removeFavorite(event) {
  let storyId = event.target.id;
  currentUser.removeFavorite(storyId, resp => {
    console.log(resp);
  });
}

function populateFavorites() {
  let favorites = currentUser.favorites;
  $('#story-list').empty();
  for (let i = 0; i < favorites.length; i++) {
    let fullUrl = favorites[i].url;
    let listItem = $(`<li></li>`);
    let star = $(`<i id=${favorites[i].storyId} class='fas fa-star pr-2'><i>`);
    let smallTag = $(`<small class='pl-2'></small>`);
    listItem.append(star);
    let favoritesTitle = favorites[i].title;
    let articleLink = $(`<a href=${fullUrl}></a>`);
    let span = $('<span></span>');
    span.append(favoritesTitle);
    articleLink.append(span);
    listItem.append(articleLink);
    let favoritesUrl = favorites[i].url;
    smallTag.append(favoritesUrl);
    listItem.append(smallTag);
    $('#story-list').append(listItem);
  }
}

function populateRegularList() {
  StoryList.getStories(function(storyList) {
    currentStoryList = storyList;
    for (let i = 0; i < storyList.stories.length; i++) {
      let fullUrl = storyList.stories[i].url;
      let listItem = $(`<li></li>`);
      let star = $(
        `<i id=${
          currentStoryList.stories[i].storyId
        } class='far fa-star pr-2'><i>`
      );
      let smallTag = $(`<small class='pl-2'></small>`);
      let articleLink = $(`<a href=${fullUrl}></a>`);
      let span = $('<span></span>');
      listItem.append(star);
      span.append(storyList.stories[i].title);
      articleLink.append(span);
      listItem.append(articleLink);
      let url = getHostname(fullUrl);
      smallTag.append(url);
      listItem.append(smallTag);
      $('#story-list').append(listItem);

      if (currentUser) {
        for (let j = 0; j < currentUser.favorites.length; j++) {
          if (
            currentUser.favorites[j].storyId === storyList.stories[i].storyId
          ) {
            star.removeClass('far');
            star.addClass('fas');
          }
        }
      }
    }
  });
}
//create function to check if favorite - seperate functions;
function populateMyStories() {
  let myStories = currentUser.ownStories;
  let starClass = 'far fa-star pr-2';
  $('#story-list').empty();
  for (let i = 0; i < myStories.length; i++) {
    for (let j = 0; j < currentUser.favorites.length; j++) {
      if (currentUser.favorites[j].storyId === myStories[i].storyId) {
        starClass = 'fas fa-star pr-2';
      }
    }
    let fullUrl = myStories[i].url;
    let listItem = $(`<li></li>`);
    let trashCan = $(
      `<i class="fas fa-trash-alt pl-2" id='${myStories[i].storyId}'</i>`
    );
    let star = $(`<i id=${myStories[i].storyId} class='${starClass}'><i>`);
    let smallTag = $(`<small class='pl-2'></small>`);
    listItem.append(star);
    let favoritesTitle = myStories[i].title;
    let articleLink = $(`<a href=${fullUrl}></a>`);
    let span = $('<span></span>');
    span.append(favoritesTitle);
    articleLink.append(span);
    listItem.append(articleLink);
    let favoritesUrl = myStories[i].url;
    smallTag.append(favoritesUrl);
    listItem.append(smallTag);
    listItem.append(trashCan);
    $('#story-list').append(listItem);
    starClass = 'far fa-star pr-2';
  }
}
