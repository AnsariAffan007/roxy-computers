const navigation = document.querySelector(".navbar");
const navigationHeight = navigation.offsetHeight;
document.documentElement.style.setProperty('--scroll-padding', navigationHeight + 'px');


// document.documentElement.style.setProperty('--carouselHeight', "100vh - " + navigationHeight + 'px');