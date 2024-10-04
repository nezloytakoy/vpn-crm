

export async function POST() {

    console.log('Привет, я ИИ');

  
    return new Response(JSON.stringify({ message: 'AI dialog initiated' }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
