const twitterBaseUrl = 'https://twitter.com/intent/tweet?text=';
const googleBaseUrl = 'https://plus.google.com/share?url=';

export default function share(title, shareURL, fbImg, twImg, hashTag, FBmessage='') {

    return function (network, extra='') {
        var twitterMessage = `${title}${hashTag}`;
        var shareWindow;

        if (network === 'twitter') {
            shareWindow = twitterBaseUrl + encodeURIComponent(twitterMessage + ' ') + shareURL + '&CMP=share_btn_tw'
        } else if (network === 'email') {
            shareWindow = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + shareURL;
        } else if (network === 'google') {
            shareWindow = googleBaseUrl + shareURL;
        }

        if (network != 'facebook') {
            window.open(shareWindow, network + 'share', 'width=640,height=320');
        } else {

          if (FB) { //http://drib.tech/programming/dynamically-change-facebook-open-graph-meta-data-javascript

            FB.ui({
              method: 'share_open_graph',
              action_type: 'og.likes',
              action_properties: JSON.stringify({
                object: {
                  'og:url': shareURL,
                  'og:title': title,
                  'og:description': FBmessage,
                  'og:image': fbImg
                }
              })
            },
            function (response) {
              // Do something
            });

          }

        }
        
    }
}