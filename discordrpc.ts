import * as DiscordRPC from 'discord-rpc';

// Replace this string with your actual Client ID from the Discord Developer Portal
const clientId = '1519260377114869780'; 

const rpc = new DiscordRPC.Client({ transport: 'ipc' });

async function updatePresence() {
    rpc.setActivity({
        state: 'Modding AnimalCompany',
        details: 'Modding Animal Company On 1.79.2 With Monkongs Menu',
        startTimestamp: Math.floor(Date.now() / 1000), // Shows time elapsed starting from now
        largeImageKey: 'monkongs_menu',
        largeImageText: 'Monkongs Menu',
        
        // Custom clickable button configuration
        buttons: [
            {
                label: 'Get My Menu', 
                url: 'https://discord.gg/PHNbu7beZp' // Replace with your actual link
            }
        ],
        instance: true,
    });
}

rpc.on('ready', () => {
    console.log('Discord Connected and should be working');
    updatePresence();
});

// Connect to Discord and catch any errors (like if Discord isn't open)
rpc.login({ clientId }).catch((err) => {
    console.error('Failed to connect to Discord RPC:', err.message);
});
