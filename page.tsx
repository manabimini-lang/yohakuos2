import React from 'react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl px-4 py-10 mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal settings and community preferences.
          </p>
        </header>

        <div className="space-y-10">
          {/* Account Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <div className="font-medium">Profile</div>
                  <div className="text-sm text-muted-foreground">Discord integration and account info</div>
                </div>
                <button className="text-sm font-medium text-primary">Edit</button>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-muted-foreground">Light, dark, or system mode</div>
                </div>
                <button className="text-sm font-medium text-primary">System</button>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Notifications</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <div className="font-medium">Community</div>
                  <div className="text-sm text-muted-foreground">Moments and Inspiration alerts</div>
                </div>
                <div className="h-5 w-10 rounded-full bg-primary/20 border border-primary/30 relative cursor-not-allowed">
                  <div className="absolute right-1 top-1 h-3 w-3 rounded-full bg-primary"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <div className="font-medium">Wisdom</div>
                  <div className="text-sm text-muted-foreground">Weekly insight delivery</div>
                </div>
                <div className="h-5 w-10 rounded-full bg-primary/20 border border-primary/30 relative cursor-not-allowed">
                  <div className="absolute right-1 top-1 h-3 w-3 rounded-full bg-primary"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Privacy</h2>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="font-medium">Data Visibility</div>
              <div className="text-sm text-muted-foreground">Manage how your moments are shared</div>
            </div>
          </section>

          {/* About Section */}
          <section className="pt-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">About YOHAKU</h2>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Platform Version: 1.0.0-D3</p>
              <p>Environment: Production Ready</p>
              <p className="mt-4">© 2024 YOHAKU OS. All rights reserved.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}