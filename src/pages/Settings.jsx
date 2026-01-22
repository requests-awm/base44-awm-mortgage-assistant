import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Clock, Mail, Bell, AlertTriangle, 
  Save, Loader2, CheckCircle, Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_SETTINGS = {
  delivery_delay_hours: 24,
  business_hours_start: '09:00',
  business_hours_end: '17:00',
  max_chase_attempts: 3,
  chase_interval_days: 2,
  auto_escalate_days: 7,
  enable_email_notifications: true,
  review_required_before_delivery: true
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedSettings = [], isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => base44.entities.SystemSettings.list()
  });

  useEffect(() => {
    if (savedSettings.length > 0) {
      const loaded = {};
      savedSettings.forEach(s => {
        try {
          loaded[s.setting_key] = JSON.parse(s.setting_value);
        } catch {
          loaded[s.setting_key] = s.setting_value;
        }
      });
      setSettings(prev => ({ ...prev, ...loaded }));
    }
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      for (const [key, value] of Object.entries(settings)) {
        const existing = savedSettings.find(s => s.setting_key === key);
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (existing) {
          await base44.entities.SystemSettings.update(existing.id, {
            setting_value: stringValue,
            last_modified_by: user?.email
          });
        } else {
          await base44.entities.SystemSettings.create({
            setting_key: key,
            setting_value: stringValue,
            last_modified_by: user?.email
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['systemSettings']);
      setHasChanges(false);
      toast.success('Settings saved');
    }
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agent Settings</h1>
            <p className="text-slate-500 mt-1">Configure automation behavior</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="bg-[#D1B36A] text-[#0E1B2A] hover:bg-[#DBC17D] font-semibold"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Delivery Timing */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Delivery Timing
              </CardTitle>
              <CardDescription>
                Control when reports are delivered to clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Default Delay (hours)</Label>
                  <span className="text-sm font-medium text-slate-900">
                    {settings.delivery_delay_hours}h
                  </span>
                </div>
                <Slider
                  value={[settings.delivery_delay_hours]}
                  onValueChange={([v]) => updateSetting('delivery_delay_hours', v)}
                  min={4}
                  max={48}
                  step={1}
                />
                <p className="text-xs text-slate-500">
                  Reports will be held for this period before delivery
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Hours Start</Label>
                  <Input
                    type="time"
                    value={settings.business_hours_start}
                    onChange={(e) => updateSetting('business_hours_start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Hours End</Label>
                  <Input
                    type="time"
                    value={settings.business_hours_end}
                    onChange={(e) => updateSetting('business_hours_end', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Reports will only be delivered during business hours
              </p>
            </CardContent>
          </Card>

          {/* Chase Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                Decision Chasing
              </CardTitle>
              <CardDescription>
                Configure follow-up behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Chase Attempts</Label>
                  <Input
                    type="number"
                    value={settings.max_chase_attempts}
                    onChange={(e) => updateSetting('max_chase_attempts', parseInt(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chase Interval (days)</Label>
                  <Input
                    type="number"
                    value={settings.chase_interval_days}
                    onChange={(e) => updateSetting('chase_interval_days', parseInt(e.target.value))}
                    min={1}
                    max={14}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auto-escalate After (days)</Label>
                <Input
                  type="number"
                  value={settings.auto_escalate_days}
                  onChange={(e) => updateSetting('auto_escalate_days', parseInt(e.target.value))}
                  min={3}
                  max={30}
                />
                <p className="text-xs text-slate-500">
                  Escalate to broker if no response after this period
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Review Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-slate-500" />
                Review & Approval
              </CardTitle>
              <CardDescription>
                Control human oversight requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label>Require Human Review</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reports must be approved before delivery
                  </p>
                </div>
                <Switch
                  checked={settings.review_required_before_delivery}
                  onCheckedChange={(v) => updateSetting('review_required_before_delivery', v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Notify team of pending reviews
                  </p>
                </div>
                <Switch
                  checked={settings.enable_email_notifications}
                  onCheckedChange={(v) => updateSetting('enable_email_notifications', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-0 shadow-sm bg-amber-50/50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Important</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Changes to these settings affect all future case processing. 
                    Existing cases will continue with their current settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}