const socket=io();

//elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = ()=>{
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMesageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of message container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMesageHeight <= scrollOffset) $messages.scrollTop = $messages.scrollHeight
}

socket.on('message',(message)=>{
    //console.log(message);
    
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
});

socket.on('locationMessage',(message)=>{
    //console.log(message);

    const html = Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();

});

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(event)=>{
    event.preventDefault();
    //disable
    $messageFormButton.setAttribute('disabled','disabled')

    const clientMessage = event.target.elements.message.value;
    socket.emit('sendMessage',clientMessage,(error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value='';
        $messageFormInput.focus()

        if(error) return console.log(error);
        console.log('A test message is delivered!');
    })
});

$locationButton.addEventListener('click',()=>{
    if(!navigator.geolocation) alert('Your browser does not support geolocation!');

    $locationButton.setAttribute('disabled','disabled');

    navigator.geolocation.getCurrentPosition(position=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $locationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })

});

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error);
        location.href='/'
    }
});